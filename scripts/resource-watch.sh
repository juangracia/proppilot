#!/usr/bin/env bash
# Resource watcher for parallel PropPilot stacks. One stdout line per state change.
# Under Monitor:  scripts/resource-watch.sh
# One-shot:       scripts/resource-watch.sh --once
# RW_PL_WARN=1 also treats macOS pressure level 2 as WARN (always set on this Mac, so off by default).
# Env: RW_INTERVAL=30 RW_WARN_FREE=20 RW_CRIT_FREE=10 RW_SWAP_GROWTH_GB=1 RW_LOAD_MULT=1.5
set -u

INTERVAL=${RW_INTERVAL:-30}
WARN_FREE=${RW_WARN_FREE:-20}
CRIT_FREE=${RW_CRIT_FREE:-10}
SWAP_GROWTH_GB=${RW_SWAP_GROWTH_GB:-1}
LOAD_MULT=${RW_LOAD_MULT:-1.5}
STATE_DIR=${RW_STATE_DIR:-$HOME/.cache/proppilot-resource-watch}
mkdir -p "$STATE_DIR" 2>/dev/null

# Run a command with a hard time limit in seconds (macOS has no `timeout`).
limited() { local s=$1; shift; perl -e 'alarm shift; exec @ARGV' "$s" "$@" 2>/dev/null; }

# Value with suffix, or n/a when empty.
fmt() { if [ -n "$1" ]; then echo "$1$2"; else echo "n/a"; fi; }

swap_used_mb() {
  sysctl -n vm.swapusage 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="used"){v=$(i+2); sub(/M/,"",v); print v}}'
}

# Unique listening pids on a port range.
listen_pids() { limited 5 lsof -nP -iTCP:"$1" -sTCP:LISTEN -t | sort -u | paste -sd, -; }

pids_rss_mb() {
  [ -z "$1" ] && { echo 0; return; }
  # ps RSS excludes compressed/swapped pages (a live JVM can show 17MB), so use top's MEM
  # (resident + compressed) for each listener and its children.
  local p all
  all=$(ps -axo pid=,ppid= 2>/dev/null | awk -v l="$1" 'BEGIN{n=split(l,a,","); for(i=1;i<=n;i++) w[a[i]]=1} {if(($1 in w)||($2 in w)) print $1}' | sort -u)
  for p in $all; do
    limited 5 top -l 1 -pid "$p" -stats mem | tail -1
  done | awk '{v=$1; if (v ~ /G/) {sub(/G.*/,"",v); s+=v*1024} else if (v ~ /M/) {sub(/M.*/,"",v); s+=v} else if (v ~ /K/) {sub(/K.*/,"",v); s+=v/1024}} END{printf "%d", s}'
}

measure() {
  local free swap_mb load1 ncpu pl jp np java node stacks claude docker top level

  free=$(limited 5 memory_pressure | awk -F': ' '/free percentage/{gsub(/%/,"",$2); print $2+0}')
  swap_mb=$(swap_used_mb)
  load1=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}')
  ncpu=$(sysctl -n hw.ncpu 2>/dev/null)
  pl=$(sysctl -n kern.memorystatus_vm_pressure_level 2>/dev/null)
  jp=$(listen_pids 8080-8084)
  np=$(listen_pids 3000-3004)
  java=$(pids_rss_mb "$jp" 'java$')
  node=$(pids_rss_mb "$np" 'node$')
  stacks=$(printf '%s' "$jp" | tr ',' '\n' | grep -c .)
  claude=$(ps -axo rss=,comm= 2>/dev/null | awk '$0 ~ /\/claude\/versions\// || $2=="claude" || $2 ~ /\/claude$/ {n++; s+=$1} END{printf "%d/%dMB", n, s/1024}')
  docker=$(limited 20 docker stats --no-stream --format '{{.MemUsage}}' | awk '
    {v=$1; if (v ~ /GiB$/) {sub(/GiB/,"",v); s+=v*1024} else if (v ~ /MiB$/) {sub(/MiB/,"",v); s+=v} else if (v ~ /KiB$/) {sub(/KiB/,"",v); s+=v/1024}; n++}
    END{if(n) printf "%d", s}')
  top=$(ps -axo rss=,comm= 2>/dev/null | sort -rn | head -3 | awk '{r=$1; $1=""; sub(/^ /,""); n=split($0,p,"/"); printf "%s%s %dMB", (NR>1?", ":""), p[n], r/1024}')

  level=$(awk -v free="$free" -v swap="$swap_mb" -v base="${SWAP_BASE_MB:-}" -v load="$load1" -v ncpu="$ncpu" -v pl="$pl" \
    -v pw="${RW_PL_WARN:-0}" -v wf="$WARN_FREE" -v cf="$CRIT_FREE" -v sg="$SWAP_GROWTH_GB" -v lm="$LOAD_MULT" 'BEGIN{
      l=0
      if (free!="" && free+0<cf) l=2; else if (free!="" && free+0<wf) l=1
      if (pl==4) l=2; else if (pl==2 && pw==1 && l<1) l=1
      if (swap!="" && base!="" && (swap-base)/1024>sg && l<1) l=1
      if (load!="" && ncpu!="" && load+0>lm*ncpu && l<1) l=1
      print (l==2?"CRIT":(l==1?"WARN":"OK"))
    }')

  if [ "${RW_LOG:-0}" = 1 ]; then
    local pg
    pg=$(limited 10 docker ps --format '{{.Names}}' | grep -ci postgres)
    [ -f "$CSV" ] || echo 'iso_ts,stacks,free_pct,swap_gb,load1,java_mb,node_mb,pg_containers,docker_mb,claude_count,claude_mb,level' > "$CSV"
    printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$stacks" "$free" \
      "$(awk -v s="$swap_mb" 'BEGIN{ if (s!="") printf "%.2f", s/1024 }')" "$load1" "$java" "$node" "${pg:-}" "$docker" \
      "${claude%%/*}" "$(printf '%s' "${claude#*/}" | tr -d 'MB')" "${level:-OK}" >> "$CSV"
  fi

  printf 'RESOURCE %s: free=%s swap=%s load=%s stacks=%s java=%sMB node=%sMB claude=%s docker=%s | top: %s\n' \
    "${level:-OK}" \
    "$(fmt "$free" %)" \
    "$(awk -v s="$swap_mb" 'BEGIN{ if (s=="") print "n/a"; else printf "%.1fG", s/1024 }')" \
    "$(fmt "$load1" "")" \
    "$stacks" "${java:-n/a}" "${node:-n/a}" "${claude:-n/a}" \
    "$(fmt "$docker" MB)" \
    "${top:-n/a}"
}

report() {
  [ -f "$CSV" ] || { echo "no samples at $CSV"; return; }
  awk -F, -v wf="$WARN_FREE" '
    NR==1 {next}
    $3=="" {next}
    { s=$2+0; n[s]++; f[s,n[s]]=$3+0; if (!(s in ml) || $5+0>ml[s]) ml[s]=$5+0 }
    END {
      best=-1
      for (s in n) {
        c=n[s]
        for (i=1;i<=c;i++) a[i]=f[s,i]
        for (i=2;i<=c;i++) { v=a[i]; j=i-1; while (j>0 && a[j]>v) { a[j+1]=a[j]; j-- } a[j+1]=v }
        med=(c%2)?a[(c+1)/2]:(a[c/2]+a[c/2+1])/2
        printf "stacks=%d samples=%d min_free=%d%% median_free=%.1f%% max_load=%.2f\n", s, c, a[1], med, ml[s]
        if (a[1]>=wf && s>best) best=s
      }
      if (best>=0) printf "suggestion: up to %d parallel stacks (min free stayed >= %d%%)\n", best, wf
      else printf "suggestion: no stacks count kept min free >= %d%%\n", wf
    }' "$CSV" | sort
}

CSV=${RW_CSV:-$STATE_DIR/samples.csv}

if [ "${1:-}" = "--report" ]; then
  report
  exit 0
fi

SWAP_BASE_MB=$(swap_used_mb)

if [ "${1:-}" = "--once" ]; then
  measure
  exit 0
fi

export RW_LOG=1
last=""
while true; do
  line=$(measure 2>/dev/null) || line=""
  if [ -n "$line" ]; then
    level=${line#RESOURCE }
    level=${level%%:*}
    if [ "$level" != "$last" ]; then
      echo "$line"
      last=$level
      printf '%s\n' "$line" > "$STATE_DIR/last" 2>/dev/null
    fi
  fi
  sleep "$INTERVAL"
done
