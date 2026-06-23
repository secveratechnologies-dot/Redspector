#!/bin/bash
echo "=== Running all Phase Verification Scripts ==="
echo ""
results=()
for script in verify_*.sh; do
  if [ "$script" = "verify_all.sh" ]; then
    continue
  fi
  echo ">>> RUNNING: $script"
  # Clear rate limits before each script to prevent rate limiting 429
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
  if bash "$script" > "${script}.log" 2>&1; then
    echo "    PASS"
    results+=("  - [x] $script: PASS")
  else
    echo "    FAIL (see ${script}.log)"
    results+=("  - [ ] $script: FAIL")
  fi
done

echo ""
echo "=== Verification Summary ==="
for res in "${results[@]}"; do
  echo "$res"
done
