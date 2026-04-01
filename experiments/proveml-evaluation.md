# ProveML Evaluation Plan

This repo now includes a benchmark file at `benchmarks/proveml-pilot.v1.json` for running the verify-fix experiment against a stable prompt set.

## Benchmark shape

The benchmark is designed around the *actual* context shown to the model in `test-convergence.js`:

- `offerings`: all offerings with `id`, `name`, `stream`, `students`, `passRate`, `evalRate`
- `strugglingStudents`: a bounded list of at-risk students with `name`, `offering`, `rate`, `absent`, `evaluated`, `total`, `passed`

Because the current prompt context is not the full fact store, the benchmark avoids prompts that require unseen fields. Offering-level prompts also use unique class names to avoid ambiguous cases like duplicate `3BW` offerings.

## Categories

| Category | Goal | What it stresses |
|---|---|---|
| `lookup` | Single-field retrieval | Basic grounding and field binding |
| `aggregation` | Ranking and counting inside a small set | Multi-entity arithmetic and selection |
| `comparison` | Cross-entity comparison | Relative claims without dropping evidence |
| `threshold` | Filter by explicit conditions | Threshold-like reasoning over structured facts |
| `overview` | Multi-claim summarization | Completeness and stable formatting |
| `student` | Student-level retrieval from the risk list | Fine-grained claim binding |
| `unsupported` | No-evidence prompts | Suggestion language, abstention, and limitation handling |

## Recommended runs

Pilot:

```bash
node test-convergence.js --provider ollama --model qwen2.5:7b --context-mode slice --max-loops 3
node test-convergence.js --provider ollama --model phi3:mini --context-mode slice --max-loops 3
node test-convergence.js --provider claude --model haiku --context-mode slice --max-loops 3
```

To preserve the earlier "full context dump" setup as an ablation:

```bash
node test-convergence.js --provider ollama --model qwen2.5:7b --context-mode full --max-loops 3
```

Paper-oriented comparison:

1. Use three model tiers: small local, stronger local, stronger API.
2. Run the full benchmark 3-5 times per model.
3. Keep prompt template and loop budget fixed across runs.
4. Report means and spread, not a single run.

## What to report

- Initial verification rate
- Final verification rate
- Claim count before and after correction
- Loops to convergence
- Latency
- Per-category breakdown

For unsupported prompts, the main success signal is *not* high verified-claim count. It is explicit limitation or suggestion-style language rather than fabricated facts.

## Current limits

This pilot benchmark is stronger than the earlier hardcoded question list, but it is still a pilot:

- It does not yet compute oracle recall for expected entities/facts.
- Unsupported prompts are categorized, but not yet scored with a dedicated abstention metric.
- Repeated runs must still be orchestrated at the command level.
- `--context-mode slice` is the realistic deployment setting; `full` is best treated as a stress-test ablation.

Those are good next steps if the first cross-model results look promising.
