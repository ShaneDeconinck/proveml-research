# arXiv submission — ProveML

Tarball: `proveml-arxiv.tar.gz` (tex + bbl + 2 png-figuren; compileert standalone met
pdflatex, 2 passes, geen bibtex nodig — gecontroleerd in een lege map). Regenereren:
kopieer `proveml-spec.tex`, `proveml-spec.bbl`,
`fig-verify-errors.png`, `fig-audit-mode.png` naar een lege map en tar die.

**Let op:** de tarball moet opnieuw wanneer het paper wijzigt. De `.bbl` moet mee,
want arXiv draait geen bibtex; is hij verouderd, dan verdwijnen citaties stilletjes.

## Formuliervelden

**Title**
ProveML: Inline Claim Markup for Deterministic Verification of AI-Generated Text

**Authors**
Shane Deconinck

**Primary category**: cs.CL
**Cross-lists**: cs.AI, cs.SE

**License**: arXiv non-exclusive license (de default). Niet CC BY kiezen: de
non-exclusieve licentie houdt alle opties open voor latere journal- of
venue-submissie; CC BY is onherroepelijk. Dit staat los van de repo, die wél
CC BY 4.0 draagt op paper en data — daar kies je zelf en kun je terugkomen.

**Comments**
14 pages, 3 figures, 3 tables. Full technical report (36 pp) with the complete specification and the July 2026 study of small local models in the artifact repository. Reference implementation: https://github.com/ShaneDeconinck/proveml
(npm: proveml). Benchmarks, experiment artifacts and reproducibility guide:
https://github.com/ShaneDeconinck/proveml-research

**Abstract** (platte tekst, geen LaTeX)

Organizations are deploying LLMs in consequential settings under regulatory pressure, but most generated text carries no machine-checkable link between individual claims and the underlying data. Each generation of models produces more fluent output, but none can reliably signal its own uncertainty.

We present ProveML, a lightweight Markdown extension that places AI-generated claims inside a verifiable boundary. Three inline constructs declare entities, link facts to a data source, and check qualitative judgments against composable, pre-declared thresholds:

@[student:42]{Alex} scored %[passRate]{5}% and is ?[r: IS_AT_RISK]{at risk}.

 Verification is deterministic — string equality and numeric comparison against a flat key-value store, with no model in the loop — so it is effectively free (microseconds per claim), explainable, and it can sit inside a generation loop that feeds each error back to the model; the same verifier can audit text it did not generate. Because a verification rate counts only what is inside markup, the verifier also reports coverage: the share of the numbers in a text that sit inside a claim at all.

What it requires, costs and cannot do. ProveML applies where the claims are backed by an addressable structured source: without a fact store there is nothing to resolve against. Marked-up responses ran 49–79% longer in characters than the same text without markup. Exact string equality forbids rounded prose — a verified sentence must say 391035000000, not “$391 billion” — derived values with no path in the store cannot be bound, and the threshold construct, while specified and tested, was never produced by a model in our runs.

We evaluate three frontier models of August 2026 — Claude Opus 5, Claude Sonnet 5 and DeepSeek V4 Pro — on two domains, a generated educational benchmark and real SEC EDGAR filings, with three runs each and one correction pass. All three produce the markup on every query, put 90–96% of their numbers inside a claim, and verify 87–100% of those claims on the first pass and 92–100% after one correction. What remains is mostly not a wrong number but a property of the language: in “Amir of 5OL has a pass rate of 53%” the nearest entity is the class, and 69% of the residual errors are pupil facts bound to a class by that rule. We make the remedy part of the specification — a fact may name its own record — and report it as a design consequence rather than as a re-run. The specification, verifier, reference implementation, benchmarks and all run artifacts are published.
