#!/usr/bin/env bash
# Load demo data through the CURRENT API (profile local) plus synthetic index values via psql.
#   scripts/seed.sh            seed if the owner has no properties yet; always refresh index values
#   scripts/seed.sh --reset    wipe properties/tenants/leases/payments (ALL users, local db only), then seed
set -euo pipefail
. "$(dirname "$0")/_lib.sh"

curl -fsS -o /dev/null "$API/countries" || { echo "seed: backend not answering on $API (run scripts/dev-up.sh)" >&2; exit 1; }

if [ "${1:-}" = "--reset" ]; then
  psql_exec -q -c "TRUNCATE payments, lease_tenants, leases, tenants, property_units RESTART IDENTITY CASCADE;"
  echo "seed: reset done"
fi

# --- synthetic index values ---------------------------------------------------------------
# index_values has no API. These rows are SYNTHETIC (invented, NOT real INDEC/BCRA data):
# monthly from 2024-01-01 to 2026-10-01, ICL grows 4.5% per month and IPC 3% per month from 1000.
# They exist only so adjusted-rent returns hasAdjustment=true. Tagged source='SYNTHETIC'.
{
  echo "BEGIN; DELETE FROM index_values WHERE source = 'SYNTHETIC';"
  awk 'BEGIN {
    split("ICL IPC", types, " "); rate["ICL"] = 1.045; rate["IPC"] = 1.03
    for (t = 1; t <= 2; t++) {
      ty = types[t]; v = 1000
      for (m = 0; m < 34; m++) {
        y = 2024 + int(m / 12); mo = (m % 12) + 1
        printf "INSERT INTO index_values (country_code, created_at, index_type, source, value, value_date) VALUES (\047AR\047, now(), \047%s\047, \047SYNTHETIC\047, %.6f, \047%04d-%02d-01\047);\n", ty, v, y, mo
        v *= rate[ty]
      }
    }
  }'
  echo "COMMIT;"
} | psql_exec -q >/dev/null
echo "seed: index_values refreshed (SYNTHETIC, ICL+IPC, 2024-01..2026-10)"

TOKEN="$(curl -fsS -X POST "$API/auth/local" -H 'Content-Type: application/json' \
  -d "$(jq -n --arg e "$SEED_EMAIL" --arg n "$SEED_NAME" '{email:$e,name:$n}')" | jq -r .token)"
[ -n "$TOKEN" ] && [ "$TOKEN" != null ] || { echo "seed: login failed" >&2; exit 1; }

api() { # method path [json] -> prints body, fails loudly on non-2xx
  local out code
  out="$(curl -sS -w '\n%{http_code}' -X "$1" "$API$2" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' ${3:+-d "$3"})"
  code="${out##*$'\n'}"
  if [ "${code:0:1}" != 2 ]; then echo "seed: $1 $2 -> HTTP $code: ${out%$'\n'*}" >&2; exit 1; fi
  printf '%s' "${out%$'\n'*}"
}

if [ "$(api GET /property-units | jq length)" -gt 0 ]; then
  echo "seed: data already present (use --reset to reseed). Index values were refreshed."
  exit 0
fi

prop() { # street number floor apartment city province postal type rent
  api POST /property-units "$(jq -n --arg s "$1" --arg n "$2" --arg f "$3" --arg a "$4" --arg c "$5" \
    --arg p "$6" --arg z "$7" --arg t "$8" --argjson r "$9" \
    '{address:($s+" "+$n), street:$s, streetNumber:$n, floor:$f, apartment:$a, city:$c, province:$p,
      postalCode:$z, type:$t, baseRentAmount:$r}')" | jq -r .id
}
tenant() { # name dni email phone
  api POST /tenants "$(jq -n --arg n "$1" --arg d "$2" --arg e "$3" --arg p "$4" \
    '{fullName:$n, nationalId:$d, email:$e, phone:$p}')" | jq -r .id
}
lease() { # propId "tenantIds json" start end rent index
  api POST /leases "$(jq -n --argjson p "$1" --argjson t "$2" --arg s "$3" --arg e "$4" --argjson r "$5" --arg i "$6" \
    '{propertyUnitId:$p, tenantIds:$t, startDate:$s, endDate:$e, monthlyRent:$r, adjustmentIndex:$i,
      adjustmentFrequencyMonths:12, countryCode:"AR", status:"ACTIVE"}')" | jq -r .id
}
payment() { # leaseId amount date type status description
  api POST /payments "$(jq -n --argjson l "$1" --argjson a "$2" --arg d "$3" --arg t "$4" --arg s "$5" --arg x "$6" \
    '{leaseId:$l, amount:$a, paymentDate:$d, paymentType:$t, status:$s, description:$x}')" >/dev/null
}
rent_payments() { # leaseId amount firstYYYY-MM lastYYYY-MM  (paid on the 5th)
  local ym="$3"
  while [ "$ym" \< "$4" ] || [ "$ym" = "$4" ]; do
    payment "$1" "$2" "$ym-05" RENT PAID "Alquiler $ym"
    ym="$(date -j -v+1m -f %Y-%m-%d "$ym-01" +%Y-%m)"
  done
}

P1=$(prop "Av. Hipólito Yrigoyen" 450 3 B "Córdoba" "Córdoba" X5000 Departamento 480000)
P2=$(prop "Obispo Trejo" 245 2 A "Córdoba" "Córdoba" X5000 Departamento 420000)
P3=$(prop "Av. Colón" 1280 "" "" "Córdoba" "Córdoba" X5003 "Local comercial" 750000)
P4=$(prop "Av. Santa Fe" 2150 5 C "Ciudad Autónoma de Buenos Aires" "CABA" C1123 Departamento 650000)
P5=$(prop "Thames" 1890 1 A "Ciudad Autónoma de Buenos Aires" "CABA" C1414 Departamento 590000)
P6=$(prop "Los Álamos" 120 "" "" "Villa Allende" "Córdoba" X5105 Casa 900000)

T1=$(tenant "María Fernanda Quiroga" 30456789 mfquiroga@example.com "+54 351 555-0101")
T2=$(tenant "Lucas Ezequiel Ferreyra" 35123456 lferreyra@example.com "+54 351 555-0102")
T3=$(tenant "Camila Belén Ferreyra" 37654321 cbferreyra@example.com "+54 351 555-0103")
T4=$(tenant "Diego Alejandro Sosa" 28901234 dsosa@example.com "+54 351 555-0104")
T5=$(tenant "Valentina Rojas" 40111222 vrojas@example.com "+54 11 5555-0105")
T6=$(tenant "Martín Ignacio Benítez" 33987654 mbenitez@example.com "+54 11 5555-0106")

L1=$(lease "$P1" "[$T1]" 2025-11-01 2027-10-31 480000 ICL)
L2=$(lease "$P2" "[$T2,$T3]" 2025-09-01 2027-08-31 420000 IPC)
L3=$(lease "$P3" "[$T4]" 2026-02-01 2029-01-31 750000 NONE)
L4=$(lease "$P4" "[$T5]" 2026-03-01 2028-02-28 650000 ICL)
L5=$(lease "$P5" "[$T1]" 2024-06-01 2026-05-31 520000 ICL)
api POST "/leases/$L5/terminate" >/dev/null
L6=$(lease "$P5" "[$T6]" 2026-08-01 2028-07-31 590000 IPC)

payment "$L1" 480000 2025-11-01 DEPOSIT PAID "Depósito en garantía"
rent_payments "$L1" 480000 2025-11 2026-10
rent_payments "$L2" 420000 2025-09 2026-08   # September and October 2026 left unpaid on purpose
rent_payments "$L3" 750000 2026-02 2026-10
rent_payments "$L4" 650000 2026-03 2026-09
payment "$L4" 650000 2026-10-05 RENT PENDING "Alquiler 2026-10 (transferencia en proceso)"
rent_payments "$L5" 520000 2024-06 2026-05
rent_payments "$L6" 590000 2026-08 2026-10

echo "seed: $(api GET /property-units | jq length) properties, $(api GET /tenants | jq length) tenants," \
     "$(api GET /leases | jq length) leases, $(api GET /payments | jq length) payments (owner $SEED_EMAIL)"
echo "seed: lease $L1 adjusted rent: $(api GET "/leases/$L1/adjusted-rent" | jq -c '{baseAmount,adjustedAmount,hasAdjustment}')"
