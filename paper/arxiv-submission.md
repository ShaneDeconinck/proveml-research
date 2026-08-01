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
32 pages, 6 figures, 8 tables. Reference implementation: https://github.com/ShaneDeconinck/proveml
(npm: proveml). Benchmarks, experiment artifacts and reproducibility guide:
https://github.com/ShaneDeconinck/proveml-research

**Abstract** (platte tekst, geen LaTeX)

Organizations are deploying LLMs in consequential settings under regulatory pressure, but most generated text carries no machine-checkable link between individual claims and the underlying data. Each generation of models produces more fluent output, but none can reliably signal its own uncertainty.

We present ProveML, a lightweight Markdown extension that places AI-generated claims inside a verifiable boundary. Three inline constructs declare entities, link facts to a data source, and check qualitative judgments against composable thresholds. Verification is deterministic: facts resolve by key-value lookup, thresholds by arithmetic comparison, with no model in the loop. Because verification is instant, it can sit inside a generation loop, feeding errors back to the LLM to improve consistency with the data.

Across four models (3.8B to API-scale, 3 runs each) three models cluster at 88-89% first-pass verification while the 3.8B one oscillates between 65% and 0% across identical runs, and residual failures are dominated by addressability errors rather than wrong values. A cross-domain evaluation on both a generated educational dataset and real SEC EDGAR financial data shows that this instability tracks the shape of the request rather than model size: on the compact benchmark all four models, including the 3.8B one, produce reliably verifiable markup. A language ablation localizes part of the difference: translating the educational prompts to English moves the 3.8B model by 22 points and, more to the point, removes the mode in which it produces nothing, while the other three shift by at most 2, so non-English deployment is a first-class variable for small models and a minor one above that. A markup coverage audit shows that verification rate alone overstates the verified share of a report's numeric content, and a baseline against SymGen's substitution mechanism shows both approaches failing on addressability but failing differently: substitution leaves undefined in the text where ProveML leaves a flagged claim. We provide the syntax specification, verification algorithm, reference implementation, and an evaluation spanning two domains, four models, a baseline and two ablations.

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
- [ ] Tarball uploaden, compilatie-preview controleren (32 pagina's)
- [ ] Metadata uit dit bestand plakken
- [ ] Na publicatie: arXiv-ID toevoegen aan beide repo-README's, trustedagentic.ai
      en de trusted-ai-pagina op abovebeyond; de drie GitHub-links op
      abovebeyond.ai/proveml/ terugzetten
