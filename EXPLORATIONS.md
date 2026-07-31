# Explorations

Work that shaped ProveML but is deliberately not in the paper, because it does not carry
a claim we can hand to a reader with the artifacts to check it. Kept here because the
questions are worth returning to, and because leaving them out of the paper silently
would be its own kind of omission.

None of the numbers below should be cited. Where a figure is mentioned it is a
recollection of a single run, not a measurement.

## End-to-end pipeline demonstration (early 2026)

Before the four-model study, the whole pipeline was exercised once against the education
dataset: ten queries spanning teacher and administrator roles, generated with a single
strong API model, verified, and corrected once where the verifier objected. Most claims
came back verified and the failures were concentrated in a handful of queries.

Why it is not in the paper: one model, one run, and the raw outputs were not preserved,
so nothing about it can be checked. It also ran against an earlier version of the education
dataset, withdrawn on 31 July 2026 and replaced by the generated one the paper describes,
so even its inputs are no longer the ones under evaluation. It also asks a weaker question than the study that
replaced it — how well does one good model do — where the interesting question turned out
to be how the mechanism behaves across models of different capability, which
`experiments/convergence-results-*.json` answers with artifacts attached.

What it did establish, informally: the pipeline works end to end, verification cost is
irrelevant next to generation cost, and a single correction pass fixes most of what the
first pass gets wrong. The first two are uncontroversial; the third is measured properly
in the paper.

## Citation characterization audit

Do published papers describe the work they cite accurately? Three arXiv papers were read,
their characterizations of cited work extracted, and a few candidates flagged where the
description looked like it might drift from the source. See
`experiments/citation-audit/`.

Why it is not in the paper: the flagged candidates were never followed through to a
verdict, and three papers is not a sample. The question is a good one — our own
bibliography verifier checks whether citation *metadata* is right, and this asks the
harder question of whether the *sentence* is — but answering it properly would be its own
study.

## Things we chose not to measure

Listed so that nobody assumes they were measured and found uninteresting:

- **Human verification effort.** Whether ProveML's rendering actually reduces the time a
  person spends checking a report. We have no user study, and the closest published
  evidence (TEN, ACL 2026 Industry) found no significant difference for a comparable
  system. The paper says so rather than implying otherwise.
- **Frontier models.** The evaluation stops at API-scale Haiku. Larger models would
  presumably clear the bar everywhere, which is exactly why the interesting measurements
  are at the small end.
- **Tolerance and rounding.** Whether a verifier that accepts "about 18" for 18.5 is
  worth having. This is real: exact string equality is what makes verification cheap and
  explainable, and also what makes natural financial prose hard to write. It is in Future
  Work because it needs a design, not just an experiment.
- **Adversarial generation.** A model deliberately trying to produce markup that passes
  verification while misleading a reader. Nothing here is a defence against that, and the
  paper does not claim to be.
