#!/bin/bash
# SymGen baseline: same models, benchmarks and runs as the ProveML experiments,
# so the two systems differ only in markup mechanism.
# Resume-safe: an existing result file is skipped.
set -uo pipefail
cd "$(dirname "$0")"

echo "=== SymGen baseline started: $(date) ==="

# Finance first (10 prompts, fast) then education (28 prompts).
for domain in finance education; do
  for run in 1 2 3; do
    for model in phi3:mini qwen2.5:3b qwen2.5:7b; do
      out="symgen-results-$domain-$model-run$run.json"
      if [ -f "$out" ]; then echo "=== $domain $model run $run: done, skipping ==="; continue; fi
      echo "=== symgen $domain $model — run $run ==="
      caffeinate -i node test-symgen-baseline.js --provider ollama --model "$model" \
        --domain "$domain" --run "$run"
    done
    out="symgen-results-$domain-haiku-run$run.json"
    if [ -f "$out" ]; then echo "=== $domain haiku run $run: done, skipping ==="; else
      echo "=== symgen $domain haiku — run $run ==="
      caffeinate -i node test-symgen-baseline.js --provider claude --model haiku \
        --domain "$domain" --run "$run"
    fi
  done
done

echo "=== SymGen baseline complete: $(date) ==="
