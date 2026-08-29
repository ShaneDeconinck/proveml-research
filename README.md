# ProveML Research

This repository holds the research-side assets that were split out of the package and app repos so their boundaries can stay clean.

It contains:

- the ProveML paper source and generated figures in `paper/`
- the citation-audit workflow, source snapshots, and structured audit stores in `audit/`; `audit/docs/sources.html` puts what the paper says about each cited work next to the source's own words, both verified against one store (`node audit/scripts/build-sources-page.mjs`)
- benchmarks, datasets, experimental scripts, and result artifacts in `benchmarks/`, `data/`, and `experiments/`
- browser demo and screenshot helpers in `demo/`

Repository roles after the split:

- `proveml`: package-first runtime implementation, docs, agent reference, and examples
- `proveml-research`: paper, audit, benchmarks, and experiment outputs
- `naviskore-viz`: application-specific integration

This repo is intentionally artifact-heavy. Unlike the package repo, it is meant to preserve the materials needed to inspect, reproduce, and extend the research workflow.

## Data

The education dataset (`data/mastery-layers-demo.json`) is generated, not
de-identified. Pupils, classes, mastery levels and aggregates are all drawn from
the model in `data/generate-education-benchmark.mjs`; the school is fictional and
no record derives from a real pupil. Regenerate it with `node
data/generate-education-benchmark.mjs`, or check a dataset against a source with
`--verify --against <path>`.

The finance dataset (`data/sec-edgar-finance.json`) is real: it is built from
public SEC EDGAR filings.

## Licence

Two licences, because this repository holds two kinds of work.

| path | licence |
|---|---|
| `paper/`, `data/` | CC BY 4.0 (`LICENSE-CC-BY-4.0`) |
| everything else — `experiments/`, `audit/`, `benchmarks/`, `demo/`, scripts | Apache-2.0 (`LICENSE`) |

Apache-2.0 matches the `proveml` package and carries an explicit patent grant.
CC BY 4.0 covers the paper and the datasets: reuse them, build on them, publish
about them — just say where they came from.

The education dataset is generated, so it is ours to license. The finance
dataset is derived from public SEC EDGAR filings, which are US government works
in the public domain; see `LICENSE-CC-BY-4.0` for what that means for that file.

## Local setup

This companion repo expects a sibling `proveml` checkout so the paper, audit, and demo artifacts use the same runtime implementation as the package repo. Keep the folders side by side, then run `npm install` here to install `proveml` from `../proveml`.

Work that shaped the design but is deliberately not in the paper — an early pipeline
demonstration whose outputs were not preserved, an unfinished citation-characterization
audit, and the things we chose not to measure — is described in
[EXPLORATIONS.md](EXPLORATIONS.md), without figures that could be mistaken for results.
