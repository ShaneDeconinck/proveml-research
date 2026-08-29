#!/bin/bash
# Finance half of the second-prompt study (see run-frontier2.sh).
set -uo pipefail
cd "$(dirname "$0")"
MODELS=("claude:claude-opus-5" "claude:claude-sonnet-5" "together:deepseek-ai/DeepSeek-V4-Pro-0813")
echo "=== frontier2 finance started: $(date) ==="
for run in 1 2 3; do
  for pm in "${MODELS[@]}"; do
    provider="${pm%%:*}"; model="${pm#*:}"; slug="${model//\//_}"
    out="convergence-results-finance-frontier2-$slug-run$run.json"
    if [ -f "$out" ]; then echo "--- finance $model run $run: exists, skip"; else
      echo "--- finance $model run $run: $(date +%H:%M)"
      caffeinate -i node test-convergence-finance.js --provider "$provider" --model "$model" \
        --context-mode slice --max-loops 1 --run "$run" --tag frontier2
    fi
  done
done
echo "=== frontier2 finance finished: $(date) ==="
