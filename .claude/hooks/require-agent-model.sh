#!/bin/bash
# PreToolUse hook for the Agent tool: deny calls that do not set `model`.
input=$(cat)
model=$(printf '%s' "$input" | jq -r '.tool_input.model // empty')
if [ -z "$model" ]; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Set `model` on every Agent call (haiku for mechanical work, sonnet for bounded code, opus for design). See CLAUDE.md."
    }
  }'
fi
exit 0
