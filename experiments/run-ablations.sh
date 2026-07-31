#!/bin/bash
# Ablation runs for the ProveML paper (July 2026 revision):
#  1. full-context: substantiates the '0% markup at full context' claim
#     with preserved artifacts (tag: fullctx, 1 run per local model)
#  2. English-prompt education benchmark: separates prompt language from
#     benchmark structure (tag: en, 3 runs per model incl. Haiku)
# Runs sequentially; caffeinate prevents sleep on the laptop.
set -uo pipefail
cd "$(dirname "$0")"

echo "=== Ablations started: $(date) ==="

echo "--- 1. Full-context ablation (Dutch benchmark, context-mode full) ---"
for model in phi3:mini qwen2.5:3b qwen2.5:7b; do
  out="convergence-results-fullctx-$model-run1.json"
  if [ -f "$out" ]; then echo "=== fullctx $model: al klaar, overslaan ==="; continue; fi
  echo "=== fullctx $model ==="
  caffeinate -i node test-convergence.js --provider ollama --model "$model" \
    --context-mode full --max-loops 3 --run 1 --tag fullctx
done

echo "--- 2. English-prompt ablation (3 runs per model) ---"
for run in 1 2 3; do
  for model in phi3:mini qwen2.5:3b qwen2.5:7b; do
    out="convergence-results-en-$model-run$run.json"
    if [ -f "$out" ]; then echo "=== en $model run $run: al klaar, overslaan ==="; continue; fi
    echo "=== en $model — run $run ==="
    caffeinate -i node test-convergence.js --provider ollama --model "$model" \
      --benchmark ../benchmarks/proveml-pilot-en.v1.json \
      --context-mode slice --max-loops 3 --run "$run" --tag en
  done
  out="convergence-results-en-haiku-run$run.json"
  if [ -f "$out" ]; then echo "=== en haiku run $run: al klaar, overslaan ==="; else
  echo "=== en haiku — run $run ==="
  caffeinate -i node test-convergence.js --provider claude --model haiku \
    --benchmark ../benchmarks/proveml-pilot-en.v1.json \
    --context-mode slice --max-loops 3 --run "$run" --tag en
  fi
done

echo "=== Ablations complete: $(date) ==="
