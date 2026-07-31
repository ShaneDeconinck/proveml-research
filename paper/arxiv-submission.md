# arXiv submission — ProveML

Tarball: `proveml-arxiv.tar.gz` (tex + bbl + 3 png-figuren; compileert standalone met
pdflatex, 2 passes, geen bibtex nodig). Regenereren: kopieer `proveml-spec.tex`,
`proveml-spec.bbl`, `fig-verify-correct.png`, `fig-verify-errors.png`,
`fig-audit-mode.png` naar een lege map en tar die.

## Formuliervelden

**Title**
ProveML: Inline Claim Markup for Deterministic Verification of AI-Generated Text

**Authors**
Shane Deconinck

**Primary category**: cs.CL
**Cross-lists**: cs.AI, cs.SE

**License**: arXiv non-exclusive license (de default). Niet CC BY kiezen: de
non-exclusieve licentie houdt alle opties open voor latere journal/venue-submissie;
CC BY is onherroepelijk.

**Comments**
27 pages, 6 figures. Reference implementation: https://github.com/ShaneDeconinck/proveml
(npm: proveml). Benchmarks, experiment artifacts and reproducibility guide:
https://github.com/ShaneDeconinck/proveml-research

**Abstract** (platte tekst, geen LaTeX)

Organizations are deploying LLMs in consequential settings under regulatory
pressure, but most generated text carries no machine-checkable link between
individual claims and the underlying data. We present ProveML (Provable Markup
Language), a lightweight Markdown extension that places AI-generated claims
inside a verifiable boundary. Three inline constructs declare entities, link
facts to a data source, and check qualitative judgments against composable
thresholds. Verification is deterministic: facts resolve by key-value lookup,
thresholds by arithmetic comparison, with no model in the loop. Because
verification is instant, it can sit inside a generation loop, feeding errors
back to the LLM to improve consistency with the data. Across four models (3.8B
to API-scale, 3 runs each), we observe a three-regime pattern: below a
capability threshold, models fail to produce verifiable markup reliably; in an
intermediate regime, models emit markup stably but make addressability errors
the loop can selectively repair; above threshold, ProveML serves as a
compliance layer. A cross-domain evaluation on a synthetic educational dataset
and real SEC EDGAR financial data shows the regime structure is
benchmark-dependent: all four models enter the verifiable boundary on the
compact benchmark. A language ablation localizes a large part of that
difference: translating the educational prompts to English moves the 3.8B model
by 42 percentage points while leaving the other three unchanged, so non-English
deployment is a first-class variable for small models. A markup coverage audit
shows that verification rate alone overstates the verified share of a report's
numeric content: the two metrics must be read together. We provide the syntax
specification, verification algorithm, reference implementation (npm: proveml),
and an evaluation spanning two domains, four models, and three ablations.

## Checklist bij indienen

- [ ] arXiv-account op shane.deconinck@gmail.com of hello@shanedeconinck.be
- [ ] Endorsement cs.CL (verwijs naar Frontiers in Education-publicatie indien gevraagd)
- [ ] Tarball uploaden, compilatie-preview controleren (27 pagina's)
- [ ] Metadata uit dit bestand plakken
- [ ] Na publicatie: arXiv-ID toevoegen aan beide repo-README's, trustedagentic.ai
      en de trusted-ai-pagina op abovebeyond
