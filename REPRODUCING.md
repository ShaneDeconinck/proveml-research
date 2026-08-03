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

Experiment 2 (error detection) lives in the sibling package repo, not here — it is the
detection suite that ships with the implementation:

```bash
cd ../proveml
node src/detection.test.js
```

It injects 20 errors across six categories (wrong values, wrong entity, no context, wrong
threshold, cross-entity swaps, subtle errors) and reports the detection rate. It also runs
as part of `npm test`.

> **Every figure in the paper regenerates from the files in this repository.** The one
> early pipeline demonstration whose outputs were not preserved has been taken out of the
> paper; it is described without figures in [EXPLORATIONS.md](EXPLORATIONS.md).

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

Ablations (full-context and English-prompt; Section 7.4 of the technical report) resume-safely:

```bash
cd experiments
bash run-ablations.sh
```

Outputs are tagged (`convergence-results-fullctx-*`, `convergence-results-en-*`) so they
never overwrite the primary runs; `aggregate-results.js` groups them separately.

SymGen baseline (Section 7.5 of the technical report), resume-safe like the ablations:

```bash
cd experiments
bash run-symgen-baseline.sh
node analyse-symgen-vs-proveml.mjs
```

The baseline is a reimplementation of SymGen's published Direct strategy against the
same fact stores, prompts and models; it is not the authors' code.

Markup coverage audit (Section 7.6 of the technical report) over the stored final responses:

```bash
cd experiments
node coverage-audit.mjs
```


## 5. Benchmark agent uptake

Run the lightweight uptake benchmark to see whether different models discover ProveML from the repo and skill surfaces, recommend the npm package vs skill ergonomics appropriately, and use valid markup when asked to execute:

```bash
npm run experiment:agent-adoption -- --provider mock
```

Replace `mock` with `claude` or `ollama` and pass `--model` or `--models` to compare real backends. Results are written to `experiments/agent-adoption-results/`.

## 6. Inspect the benchmark and data inputs

- Education: `benchmarks/proveml-pilot.v1.json`
- Finance: `benchmarks/proveml-finance.v1.json`
- Generated education fact store: `data/mastery-layers-demo.json`
- SEC EDGAR finance fact store: `data/sec-edgar-finance.json`

The education dataset is generated, not de-identified: every pupil is drawn from
a latent-ability model, the aggregates are computed from those draws, and the
school is fictional. It regenerates byte-identically from its seed:

```bash
node data/generate-education-benchmark.mjs
```

`--verify --against <path>` compares a generated dataset against a source file
and reports any mastery vector, pupil name or school name they share. Run it if
you adapt the generator to your own schema and want to be sure nothing carried
over.

## 7. Verify the bibliography

Every citation carrying an arXiv id or DOI is checked mechanically against the
canonical record (arXiv API / Crossref) — author surnames, title, year — with no
model in the loop:

```bash
node audit/scripts/verify-bibliography.mjs
```

Three levels, weakest last:

- **canonical record** — arXiv API or Crossref: authors, title and year compared field by field
- **cited page** — for entries with only a URL: the claimed title and every personal
  byline must actually occur on the page (this is what catches an invented byline)
- **by hand** — four entries (a court citation, a press release, the AI Act, a Reuters
  wire story) have no machine-resolvable identifier and their sources block automated
  fetches; they are listed by name at the end of every run, with the reason recorded in
  `KNOWN_UNCHECKABLE` in the script

Exit code 1 on any mismatch, and also when a NEW entry appears that is neither
machine-verifiable nor on that documented list — so an unverifiable citation
cannot enter the bibliography unnoticed. A temporarily unreachable page is
reported but does not fail the run: the gate asks whether an entry *can* be
verified, not whether the network cooperated today.

## 8. Paper source

The manuscript source is in `paper/proveml-spec.tex`, with bibliography in `paper/proveml.bib` and
canonical grammar in `paper/proveml.ebnf`.
