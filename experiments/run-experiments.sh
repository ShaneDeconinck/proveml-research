#!/bin/bash
# Run convergence experiments: 3 repeats per model
# Usage: ./run-experiments.sh [REPEATS]
#
# Requires: ollama running locally, claude CLI installed
# Models: phi3:mini, qwen2.5:3b, qwen2.5:7b (local), haiku (API)

REPEATS=${1:-3}

echo "Running $REPEATS repeats per model..."
echo ""

# Local models via Ollama
for model in phi3:mini qwen2.5:3b qwen2.5:7b; do
  for run in $(seq 1 $REPEATS); do
    echo "=== $model — run $run/$REPEATS ==="
    node test-convergence.js --provider ollama --model "$model" --context-mode slice --max-loops 3 --run "$run"
    echo ""
  done
done

# API model
for run in $(seq 1 $REPEATS); do
  echo "=== haiku — run $run/$REPEATS ==="
  node test-convergence.js --provider claude --model haiku --context-mode slice --max-loops 3 --run "$run"
  echo ""
done

echo "All runs complete. Aggregate with: node aggregate-results.js"
