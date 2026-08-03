# arXiv submission — ProveML

Tarball: `proveml-arxiv.tar.gz` (tex + bbl + 3 png-figuren; compileert standalone met
pdflatex, 2 passes, geen bibtex nodig — gecontroleerd in een lege map). Regenereren:
kopieer `proveml-spec.tex`, `proveml-spec.bbl`, `fig-verify-correct.png`,
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
14 pages, 4 figures, 5 tables. Full technical report (36 pp) with complete specification and all ablations in the artifact repository. Reference implementation: https://github.com/ShaneDeconinck/proveml
(npm: proveml). Benchmarks, experiment artifacts and reproducibility guide:
https://github.com/ShaneDeconinck/proveml-research

**Abstract** (platte tekst, geen LaTeX)

Organizations are deploying LLMs in consequential settings under regulatory pressure, but most generated text carries no machine-checkable link between individual claims and the underlying data. Each generation of models produces more fluent output, but none can reliably signal its own uncertainty.

We present ProveML, a lightweight Markdown extension that places AI-generated claims inside a verifiable boundary. Three inline constructs declare entities, link facts to a data source, and check qualitative judgments against composable, pre-declared thresholds:

@[student:42]\Alex\ scored %[passRate]\5\% and is ?[r: IS\_AT\_RISK]\at risk\.

 Verification is deterministic — string equality and arithmetic against a flat key-value store, with no model in the loop — so it is instant (under 0.2 ms per claim), explainable, and can sit inside a generation loop that feeds each error back to the model; the same verifier can audit text it did not generate.

What it requires, costs and cannot do. ProveML applies where the claims are backed by an addressable structured source: without a fact store there is nothing to resolve against. Marked-up responses ran 52--60% longer in characters than the same text without markup, and three quarters of queries needed no correction pass while a quarter exhausted all three. Exact string equality forbids rounded prose — a verified sentence must say 391035000000, not "\$391 billion" — derived values with no path in the store cannot be bound, and the threshold construct, while specified and tested, was never produced by a model in our benchmark runs.

We evaluate across four models (3.8B to API-scale) and two domains — a generated educational benchmark and real SEC EDGAR filings — with a reimplemented SymGen baseline and ablations on prompt language and context size. Three findings carry the paper. Whether a model produces verifiable markup at all depends on the shape of the request more than on the size of the model. Verification rate alone overstates how much of a report has been checked, so we pair it with a markup-coverage metric and show the two can diverge widely at identical rates. And both ProveML and substitution fail on addressability, but differently: substitution leaves a hole in the sentence, ProveML leaves a flagged claim carrying the value that was expected instead. The specification, verifier, reference implementation, benchmarks and all run artifacts are published.

## Checklist bij indienen

- [x] arXiv-account
- [x] Endorsement cs.CL
- [ ] **Repo's publiek zetten** — beide URL's staan in de Comments én in sectie 9
      van het paper. Zolang ze privé zijn loopt elke lezer tegen een 404:
      `gh repo edit ShaneDeconinck/proveml --visibility public`
      (idem voor `-research`). Doe dit vóór of samen met de indiening.
- [ ] Citatiechecklist doorlopen (`citation-checklist.md`, 55 referenties) — de
      metadata is machinaal gecontroleerd, of de zin klopt niet.
- [ ] npm 1.1.0 publiceren, zodat het pakket overeenkomt met wat het paper beschrijft
- [ ] Tarball uploaden, compilatie-preview controleren (14 pagina's)
- [ ] Metadata uit dit bestand plakken
- [ ] Na publicatie: arXiv-ID toevoegen aan beide repo-README's, trustedagentic.ai
      en de trusted-ai-pagina op abovebeyond; de drie GitHub-links op
      abovebeyond.ai/proveml/ terugzetten
