# Reproducing the ProveML research artifacts

This repository holds the paper, citation audit, benchmarks, demo surfaces, and experiment outputs.
The runtime implementation itself lives in the sibling `proveml` repository, and this repo installs it
locally so every research artifact uses the same source of truth.

## Setup

Clone the two repositories side by side, then install both:

```bash
git clone https://github.com/ShaneDeconinck/proveml.git
git clone https://github.com/ShaneDeconinck/proveml-research.git

cd proveml
npm install
npm test

cd ../proveml-research
npm install
```

`npm install` in `proveml-research` links the sibling `../proveml` package through the local
file dependency in `package.json`.

## 1. View the paper demo and screenshots

```bash
npx serve .
```

Then open `http://localhost:3000/demo/proveml-demo.html`. This renders the paper figures through the
real ProveML runtime against the SEC EDGAR fact store.

## 2. Regenerate the paper panels

```bash
npm run paper:examples
npm run paper:panels
```

Generated panels land in `paper/panels/`, and `paper/generate-paper-examples.js --png` refreshes the
paper figure PNGs when Quick Look is available.

## 3. Regenerate the citation audit

```bash
npm run audit:references
```

Open `audit/docs/references.html` to inspect the three-column citation audit.

## 4. Reproduce the convergence experiments

Education benchmark (requires Ollama with `phi3:mini`, `qwen2.5:3b`, `qwen2.5:7b`, plus Claude CLI for Haiku):

```bash
cd experiments
bash run-experiments.sh 3
node aggregate-results.js
```

Finance benchmark:

```bash
cd experiments
bash run-experiments-finance.sh 3
```

Pre-computed results from the paper are preserved in `experiments/convergence-results-*-run*.json`.


## 5. Benchmark agent uptake

Run the lightweight uptake benchmark to see whether different models discover ProveML from the repo and skill surfaces, recommend the npm package vs skill ergonomics appropriately, and use valid markup when asked to execute:

```bash
npm run experiment:agent-adoption -- --provider mock
```

Replace `mock` with `claude` or `ollama` and pass `--model` or `--models` to compare real backends. Results are written to `experiments/agent-adoption-results/`.

## 6. Inspect the benchmark and data inputs

- Education: `benchmarks/proveml-pilot.v1.json`
- Finance: `benchmarks/proveml-finance.v1.json`
- Synthetic education fact store: `data/mastery-layers-demo.json`
- SEC EDGAR finance fact store: `data/sec-edgar-finance.json`

## 7. Paper source

The manuscript source is in `paper/proveml-spec.tex`, with bibliography in `paper/proveml.bib` and
canonical grammar in `paper/proveml.ebnf`.
