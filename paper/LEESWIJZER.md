# Leeswijzer voor de eigen leesronde

Wat je NIET hoeft na te kijken, want mechanisch gegarandeerd:

- **Elke tabelrij** regenereert byte-gelijk uit `experiments/generate-paper-tables.mjs`
  (gecontroleerd: nul afwijkingen). Cijfers overtypen kan niet meer misgaan.
- **Elk prozacijfer** is door vier onafhankelijke agent-lezers nagerekend tegen de
  runbestanden, en de consistentiechecker bevestigde dat kort paper en technisch
  rapport nergens uiteenlopen.
- **Referentie-metadata**: 50 canoniek geverifieerd (Crossref/arXiv), 11 op de
  geciteerde pagina, 0 mismatches (`npm run audit:bibliography`).
- **De assemblage**: `python3 build-short-paper.py` is deterministisch; het korte
  paper is letterlijk opgebouwd uit blokken van het geverifieerde rapport.

Waar alleen jouw oordeel telt — lees hierop:

1. **Sta je achter elke zin?** Vooral:
   - de voetnoot op p.5 die de ingetrokken dataset bekent (jouw naam, jouw verhaal
     — wil je dit zo vertellen?)
   - "In short: ProveML is iXBRL for AI-generated text" als framing
   - de "Declaration of Generative AI Use" achteraan
   - de noviteitsclaim ("to our knowledge, no existing framework combines…")
2. **De toon**: is dit hoe jij klinkt? Het bindweefsel is door mij geschreven.
3. **De citatiekarakteriseringen**: `paper/citation-checklist.md` toont per referentie
   wat het paper erover beweert plus de bronlink. De 26 dragende zijn al tegen de
   bron gelegd (drie gecorrigeerd); jouw pass kan licht zijn — lees de zinnen, klik
   waar je twijfelt.
4. **Wat er NIET staat**: het korte paper laat veel weg. Mis je iets dat er voor jou
   in moet?

Bestanden:

- het paper: `paper/proveml-spec.pdf` (14 p.) — dit gaat naar arXiv
- het rapport: `paper/proveml-technical-report.pdf` (36 p.) — blijft in de repo
- indieningsblad: `paper/arxiv-submission.md` (metadata om te plakken)
- tarball, klaar: `paper/proveml-arxiv.tar.gz`

Na jouw leesronde is de volgorde: wijzigingen doorgeven (paginanummer + wat er
anders moet volstaat) → herbouw + gates → `npm publish` → uploaden op arxiv.org
(non-exclusieve licentie, preview = 14 pagina's).
