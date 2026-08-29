#!/bin/bash
# Second prompt, after the finding: the same education benchmark, models and
# budget as run-frontier.sh, with the system prompt now telling the model that a
# fact may name its own record (proveml >= 0.3.1) and that a cutoff from the
# question is not a fact. Tag frontier2 keeps the runs apart from the first.
set -uo pipefail
cd "$(dirname "$0")"
MODELS=("claude:claude-opus-5" "claude:claude-sonnet-5" "together:deepseek-ai/DeepSeek-V4-Pro-0813")
echo "=== frontier2 runs started: $(date) ==="
for run in 1 2 3; do
  for pm in "${MODELS[@]}"; do
    provider="${pm%%:*}"; model="${pm#*:}"; slug="${model//\//_}"
    out="convergence-results-frontier2-$slug-run$run.json"
    if [ -f "$out" ]; then echo "--- education $model run $run: exists, skip"; else
      echo "--- education $model run $run: $(date +%H:%M)"
      caffeinate -i node test-convergence.js --provider "$provider" --model "$model" \
        --benchmark ../benchmarks/proveml-pilot-en.v1.json --context-mode slice --max-loops 1 --run "$run" --tag frontier2
    fi
  done
done
echo "=== frontier2 runs finished: $(date) ==="
