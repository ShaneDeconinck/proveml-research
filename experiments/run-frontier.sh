#!/bin/bash
# Frontier runs, August 2026: three models, three runs each, English education
# benchmark (28 queries) and finance benchmark (10 queries), one correction
# pass. Tag "frontier" keeps the artifacts apart from the 2026-07 local-model
# study. Resume-safe: an existing output file is skipped.
set -uo pipefail
cd "$(dirname "$0")"
MODELS=("claude:claude-opus-5" "claude:claude-sonnet-5" "together:deepseek-ai/DeepSeek-V4-Pro-0813")
echo "=== frontier runs started: $(date) ==="
for run in 1 2 3; do
  for pm in "${MODELS[@]}"; do
    provider="${pm%%:*}"; model="${pm#*:}"; slug="${model//\//_}"
    out="convergence-results-frontier-$slug-run$run.json"
    if [ -f "$out" ]; then echo "--- education $model run $run: exists, skip"; else
      echo "--- education $model run $run: $(date +%H:%M)"
      caffeinate -i node test-convergence.js --provider "$provider" --model "$model" \
        --benchmark ../benchmarks/proveml-pilot-en.v1.json --context-mode slice --max-loops 1 --run "$run" --tag frontier
    fi
    out="convergence-results-finance-frontier-$slug-run$run.json"
    if [ -f "$out" ]; then echo "--- finance $model run $run: exists, skip"; else
      echo "--- finance $model run $run: $(date +%H:%M)"
      caffeinate -i node test-convergence-finance.js --provider "$provider" --model "$model" \
        --context-mode slice --max-loops 1 --run "$run" --tag frontier
    fi
  done
done
echo "=== frontier runs finished: $(date) ==="
