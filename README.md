# ProveML Research

This repository holds the research-side assets that were split out of the package and app repos so their boundaries can stay clean.

It contains:

- the ProveML paper source and generated figures in `paper/`
- the citation-audit workflow, source snapshots, and structured audit stores in `audit/`
- benchmarks, datasets, experimental scripts, and result artifacts in `benchmarks/`, `data/`, and `experiments/`
- browser demo and screenshot helpers in `demo/`

Repository roles after the split:

- `proveml`: package-first runtime implementation, docs, agent reference, and examples
- `proveml-research`: paper, audit, benchmarks, and experiment outputs
- `naviskore-viz`: application-specific integration

This repo is intentionally artifact-heavy. Unlike the package repo, it is meant to preserve the materials needed to inspect, reproduce, and extend the research workflow.

## Local setup

This companion repo expects a sibling `proveml` checkout so the paper, audit, and demo artifacts use the same runtime implementation as the package repo. Keep the folders side by side, then run `npm install` here to install `proveml` from `../proveml`.
