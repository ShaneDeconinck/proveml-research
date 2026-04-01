#!/bin/bash
# Run finance convergence experiments: 3 repeats per model
REPEATS=${1:-3}

echo "Running finance benchmark: $REPEATS repeats per model..."
echo ""

for model in phi3:mini qwen2.5:3b qwen2.5:7b; do
  for run in $(seq 1 $REPEATS); do
    echo "=== $model — run $run/$REPEATS ==="
    node test-convergence-finance.js --provider ollama --model "$model" --context-mode slice --max-loops 3 --run "$run"
    echo ""
  done
done

for run in $(seq 1 $REPEATS); do
  echo "=== haiku — run $run/$REPEATS ==="
  node test-convergence-finance.js --provider claude --model haiku --context-mode slice --max-loops 3 --run "$run"
  echo ""
done

echo "All finance runs complete."
