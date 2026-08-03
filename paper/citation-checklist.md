# Citation checklist

For each reference: read what the paper says it does, open the source, and decide
whether the sentence is a fair description. Metadata is already machine-checked
(`npm run audit:bibliography`); this is the part that needs a person.

66 references, 61 cited in prose.

---

## ais

**Measuring Attribution in Natural Language Generation Models**  
Rashkin, H. and Nikolaev, V. and Lamm, M. and Aroyo, L. and Collins, M. and Das, D. and Petrov, S. and Tomar, G. S. and Turc, I. and Reitter, D. · Computational Linguistics 2023  
<https://doi.org/10.1162/coli_a_00486>

What the paper claims (1 place):

- The AIS framework gives this field its shared evaluation vocabulary --- whether a statement is attributable to identified sources, as judged by humans --- and ALCE benchmarks citation generation directly, scoring whether generated statements are supported by the passages they cite.

- [ ] checked

## alce

**Enabling Large Language Models to Generate Text with Citations**  
Gao, T. and Yen, H. and Yu, J. and Chen, D. · Proc. EMNLP 2023  
<https://doi.org/10.18653/v1/2023.emnlp-main.398>

What the paper claims (1 place):

- The AIS framework gives this field its shared evaluation vocabulary --- whether a statement is attributable to identified sources, as judged by humans --- and ALCE benchmarks citation generation directly, scoring whether generated statements are supported by the passages they cite.

- [ ] checked

## alignmentbottleneck

**The Alignment Bottleneck in Decomposition-Based Claim Verification**  
Akhter, M. E. and Ruggeri, F. and Bilal, I. M. and Procter, R. and Liakata, M. · arXiv:2602.10380 2026  
<https://arxiv.org/abs/2602.10380>

What the paper claims (1 place):

- show that decomposition helps only when the evidence is granular and aligned per sub-claim --- a property ProveML's fact store has by construction rather than by retrieval.

- [ ] checked

## bainbridge1983

**Ironies of automation**  
Bainbridge, L. · Automatica 1983  
<https://doi.org/10.1016/0005-1098(83)90046-8>

What the paper claims (1 place):

- This creates precisely the conditions described in Bainbridge's classic analysis of the ironies of automation and well-documented in the trust-in-automation literature: as automated systems become more reliable, human operators trust them more and monitor them less.

- [ ] checked

## c2pa

**C2PA Technical Specification**  
Coalition for Content Provenance and Authenticity · \urlhttps://c2pa.org/specifications/ 2022  
<https://c2pa.org/specifications/>

What the paper claims (1 place):

- Provenance standards. W3C PROV-O and C2PA provide document-level provenance metadata.

- [ ] checked

## citednotverified

**Cited but Not Verified: Parsing and Evaluating Source Attribution in LLM Deep Research Agents**  
Onweller, H. and Lumer, E. and Huber, A. and Ramchandani, P. and Subbiah, V. K. and Feld, C. · arXiv:2605.06635 2026  
<https://arxiv.org/abs/2605.06635>

What the paper claims (1 place):

- quantify the consequence: parsing inline citations out of LLM-generated Markdown is deterministic and reliable, but checking what those citations support is not, and even frontier models' citations frequently fail that check.

- [ ] checked

## claimdb

**ClaimDB: A Fact Verification Benchmark over Large Structured Data**  
Theologitis, M. and Dammu, P. P. S. and Shah, C. and Suciu, D. · Proc. ACL 2026  
<https://doi.org/10.18653/v1/2026.acl-long.1589>

What the paper claims (1 place):

- ClaimDB benchmarks fact verification over large structured databases, where reading the evidence breaks down and verification shifts to executable programs; it also reports that models struggle to abstain when the data cannot decide a claim, which matches our finding in Section~sec:education.

- [ ] checked

## deloitte2025

**Deloitte was caught using AI in \$290,000 report to help the Australian government crack down on welfare after a researcher flagged hallucinations**  
Paoli, N. · Fortune, \urlhttps://fortune.com/2025/10/07/deloitte-ai-australia-government-report-hallucinations-technology-290000-refund/ 2025  
<https://fortune.com/2025/10/07/deloitte-ai-australia-government-report-hallucinations-technology-290000-refund/>

What the paper claims (1 place):

- Meanwhile, the consequences are real and adoption is accelerating. In 2025, Deloitte delivered a government report with AI-fabricated citations.

- [ ] checked

## dspy

**DSPy: Compiling Declarative Language Model Calls into State-of-the-Art Pipelines**  
Khattab, O. and Singhvi, A. and Maheshwari, P. and Zhang, Z. and Santhanam, K. and Vardhamanan, S. and Haq, S. and Sharma, A. and Joshi, T. T. and Moazam, H. and Miller, H. and Zaharia, M. and Potts, C. · Proc. ICLR 2024  
<https://arxiv.org/abs/2310.03714>

What the paper claims (1 place):

- Output validation (Guardrails AI, DSPy, NeMo Guardrails ): programmatic constraint enforcement that can operate at output or sentence level.

- [ ] checked

## euaiact

**Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act)**  
European Parliament and Council of the European Union · Official Journal of the European Union 2024  
<(no link in the entry)>

What the paper claims (1 place):

- The EU AI Act classifies AI systems used for consequential decisions as "high-risk" (Annex III), requiring transparency, human oversight, and risk management.

- [ ] checked

## evidencesurvey

**Attribution, Citation, and Quotation: A Survey of Evidence-based Text Generation with Large Language Models**  
Schreieder, T. and Schopf, T. and F\"arber, M. · Proc. ACL 2026  
<https://doi.org/10.18653/v1/2026.acl-long.1430>

What the paper claims (1 place):

- For the wider landscape, survey 134 papers and 300 metrics on evidence-based generation.

- [ ] checked

## factool

**FacTool: Factuality Detection in Generative AI -- A Tool Augmented Framework for Multi-Task and Multi-Domain Scenarios**  
Chern, I-C. and Chern, S. and Chen, S. and Yuan, W. and Feng, K. and Zhou, C. and He, J. and Neubig, G. and Liu, P. · arXiv:2307.13528 2023  
<https://arxiv.org/abs/2307.13528>

What the paper claims (2 places):

- Current approaches to the AI reliability problem include several strategies, none of which addresses the structural verification gap: enumerate Post-hoc fact-checking (FActScore, SAFE, FacTool, SelfCheckGPT, RefChecker ): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals.
- Post-hoc fact-checking (AI in the loop). FActScore, SAFE, FacTool, and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search.

- [ ] checked

## factscore

**FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation**  
Min, S. and Krishna, K. and Lyu, X. and Lewis, M. and Yih, W. and Koh, P. and Iyyer, M. and Zettlemoyer, L. and Hajishirzi, H. · Proc. EMNLP 2023  
<https://doi.org/10.18653/v1/2023.emnlp-main.741>

What the paper claims (2 places):

- Current approaches to the AI reliability problem include several strategies, none of which addresses the structural verification gap: enumerate Post-hoc fact-checking (FActScore, SAFE, FacTool, SelfCheckGPT, RefChecker ): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals.
- Post-hoc fact-checking (AI in the loop). FActScore, SAFE, FacTool, and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search.

- [ ] checked

## farquhar2024

**Detecting hallucinations in large language models using semantic entropy**  
Farquhar, S. and Kossen, J. and Kuhn, L. and Gal, Y. · Nature 2024  
<https://doi.org/10.1038/s41586-024-07421-0>

What the paper claims (1 place):

- Emerging interpretability research can detect some internal uncertainty signals, but probes do not generalize across tasks, entropy methods fail on confident errors, and probing methods require white-box access.

- [ ] checked

## fever

**FEVER: a Large-scale Dataset for Fact Extraction and VERification**  
Thorne, J. and Vlachos, A. and Christodoulopoulos, C. and Mittal, A. · Proc. NAACL-HLT 2018  
<https://doi.org/10.18653/v1/N18-1074>

What the paper claims (1 place):

- Data-grounded generation. Fact verification against evidence has a canonical benchmark lineage --- FEVER for textual sources, TabFact for tables, FEVEROUS for both at once --- in which a trained model judges whether evidence supports a claim; ProveML sits outside that lineage by making the judgment a lookup rather than a model.

- [ ] checked

## feverous

**FEVEROUS: Fact Extraction and VERification Over Unstructured and Structured information**  
Aly, R. and Guo, Z. and Schlichtkrull, M. and Thorne, J. and Vlachos, A. and Christodoulopoulos, C. and Cocarascu, O. and Mittal, A. · Proc. NeurIPS Datasets and Benchmarks Track 2021  
<https://arxiv.org/abs/2106.05707>

What the paper claims (1 place):

- Data-grounded generation. Fact verification against evidence has a canonical benchmark lineage --- FEVER for textual sources, TabFact for tables, FEVEROUS for both at once --- in which a trained model judges whether evidence supports a claim; ProveML sits outside that lineage by making the judgment a lookup rather than a model.

- [ ] checked

## fhir

**FHIR (Fast Healthcare Interoperability Resources), Release 5**  
HL7 International ·  2023  
<https://hl7.org/fhir/R5/>

What the paper claims (2 places):

- Design philosophy. ProveML is deliberately assembled from established patterns rather than invented from scratch: itemize[nosep] Host language: Markdown (natively produced by LLMs) Inline tagging model from iXBRL Operator vocabulary from FHIR clinical reference ranges and JSON Schema validation Fact store from the Entity-Attribute-Value (EAV) pattern; arrive at a comparable typed key-value state with a non-probabilistic admission check, in the agent/tool setting rather than in text Verify-then-render pipeline from standard compiler design itemize A skeptical reader should find each component familiar.
- Threshold Registry The threshold registry draws on the design patterns of clinical reference ranges (HL7 FHIR ), JSON Schema validation, and monitoring alert systems (Grafana, Datadog).

- [ ] checked

## finground

**FinGround: Detecting and Grounding Financial Hallucinations via Atomic Claim Verification**  
Guo, D. and Wu, J. and Yiu, S. M. · Proc. ACL Industry Track 2026  
<https://arxiv.org/abs/2604.23588>

What the paper claims (2 places):

- Domain-specific pipelines such as FinGround add deterministic sub-steps (recomputing a stated figure from a table) but still decompose and classify claims with a model.
- FinGround is the closest 2026 system: it decomposes financial answers into typed atomic claims, recomputes arithmetic ones against structured tables, and rewrites unsupported claims with table-cell citations.

- [ ] checked

## finverbench

**FinVerBench: Benchmark Validity and Calibration in Large Language Model Financial Statement Verification**  
Panda, S. · arXiv:2605.29586 2026  
<https://arxiv.org/abs/2605.29586>

What the paper claims (1 place):

- FinVerBench verifies statements against SEC XBRL filings and finds measured performance shifts with numeric rendering (rounded vs.\ unrounded) --- an external measurement of the canonicalization sensitivity we discuss in Section~sec:limitations.

- [ ] checked

## gartner2023

**More Than 80\% of Enterprises Will Have Used Generative AI APIs or Deployed Generative AI-Enabled Applications by 2026**  
Gartner · Press Release 2023  
<(no link in the entry)>

What the paper claims (1 place):

- Yet the majority of organizations now use AI in at least one function, and Gartner projected that over 80\% of enterprises would have used generative AI APIs or deployed generative AI-enabled applications by 2026.

- [ ] checked

## gavel

**GAVEL: Evidence-Contract Debate with Mechanized Scrutiny for Provenance-Grounded Fact-Checking**  
Xu, R. and Li, G. and Sheng, V. S. · Findings of ACL 2026  
<https://doi.org/10.18653/v1/2026.findings-acl.1789>

What the paper claims (2 places):

- That sweep found systems that bind claims to evidence contracts, emit provenance triples, or maintain typed key-value state with non-probabilistic admission, but none that extends an authoring format with inline claim markup, and none that constrains qualitative wording through a declared threshold vocabulary.
- GAVEL moves partway toward a binding contract: debating agents must state atomic subclaims bound to explicit evidence units, and a scrutinizer validates cited identifiers and quoted spans deterministically --- but the debate that produces the subclaims is model-driven, and the evidence units are text spans rather than addressable data paths.

- [ ] checked

## genprove

**GenProve: Learning to Generate Text with Fine-Grained Provenance**  
Wei, J. and Wang, X. and Liao, Y. and Dong, J. and Liu, Y. and Jia, C. and Yu, B. and Zhu, J. · Proc. ACL 2026  
<https://doi.org/10.18653/v1/2026.acl-long.228>

What the paper claims (2 places):

- That sweep found systems that bind claims to evidence contracts, emit provenance triples, or maintain typed key-value state with non-probabilistic admission, but none that extends an authoring format with inline claim markup, and none that constrains qualitative wording through a declared threshold vocabulary.
- GenProve learns to emit provenance triples alongside the answer, and reports a sharp gap between surface quotation, which models handle, and inference-backed provenance, which they do not --- a split that maps onto which claims ProveML can bind deterministically at all.

- [ ] checked

## googlebard2023

**Google AI chatbot Bard offers inaccurate information in company ad**  
Coulter, M. and Bensinger, G. · Reuters 2023  
<(no link in the entry)>

What the paper claims (1 place):

- Earlier, fabricated ChatGPT citations were submitted to a U.S.\ federal court, and a factual error in the launch demo materials for Google's Bard contributed to a \$100 billion market-cap drop.

- [ ] checked

## googleground

**Grounding with Google Search**  
Google · Gemini API documentation, \urlhttps://ai.google.dev/gemini-api/docs/grounding 2024  
<https://ai.google.dev/gemini-api/docs/grounding>

What the paper claims (2 places):

- Some systems (e.g., Google's grounding API ) additionally return support scores and claim-to-source metadata.
- Attribution (where, not whether). Anthropic's Citations API, OpenAI's response annotations, and Google's Vertex AI Grounding link generated text to source documents or passages.

- [ ] checked

## guardrails

**Guardrails: Adding guardrails to large language models**  
Guardrails AI · \urlhttps://github.com/guardrails-ai/guardrails 2024  
<https://github.com/guardrails-ai/guardrails>

What the paper claims (1 place):

- Output validation (Guardrails AI, DSPy, NeMo Guardrails ): programmatic constraint enforcement that can operate at output or sentence level.

- [ ] checked

## ixbrl

**Inline XBRL Part 1: Specification 1.1**  
XBRL International · \urlhttps://www.xbrl.org/specification/inlinexbrl-part1/rec-2013-11-18/inlinexbrl-part1-rec-2013-11-18.html 2013  
<https://www.xbrl.org/specification/inlinexbrl-part1/rec-2013-11-18/inlinexbrl-part1-rec-2013-11-18.html>

What the paper claims (3 places):

- itemize The closest structural analog is iXBRL (Inline XBRL), which embeds machine-readable tags in human-readable financial reports, enabling automated audit of reported figures.
- Design philosophy. ProveML is deliberately assembled from established patterns rather than invented from scratch: itemize[nosep] Host language: Markdown (natively produced by LLMs) Inline tagging model from iXBRL Operator vocabulary from FHIR clinical reference ranges and JSON Schema validation Fact store from the Entity-Attribute-Value (EAV) pattern; arrive at a comparable typed key-value state with a non-probabilistic admission check, in the agent/tool setting rather than in text Verify-then-render pipeline from standard compiler design itemize A skeptical reader should find each component familiar.
- What ProveML adds to that lineage is not the binding but the verdict: RDFa says what a span refers to, and assumes the author meant it; ProveML asks whether the claim survives comparison with the record. iXBRL embeds machine-readable tags in human-readable financial reports, the closest structural analog among document standards.

- [ ] checked

## ji2023

**Survey of Hallucination in Natural Language Generation**  
Ji, Z. and Lee, N. and Frieske, R. and Yu, T. and Su, D. and Xu, Y. and Ishii, E. and Bang, Y. J. and Madotto, A. and Fung, P. · ACM Computing Surveys 2023  
<https://doi.org/10.1145/3571730>

What the paper claims (1 place):

- More broadly, hallucination is a well-documented reliability problem across deep-learning-based natural language generation systems.

- [ ] checked

## kalai2024

**Calibrated Language Models Must Hallucinate**  
Kalai, A. T. and Vempala, S. S. · Proc. STOC 2024  
<https://arxiv.org/abs/2311.14648>

What the paper claims (1 place):

- prove formally that any language model satisfying natural calibration conditions must hallucinate, at a rate approaching the fraction of facts that appear exactly once in the training data; subsequent work by shows that standard training and evaluation pipelines actively reward guessing over acknowledging uncertainty.

- [ ] checked

## kalai2025

**Why Language Models Hallucinate**  
Kalai, A. T. and Nachum, O. and Vempala, S. S. and Zhang, E. · OpenAI, arXiv:2509.04664 2025  
<https://arxiv.org/abs/2509.04664>

What the paper claims (1 place):

- prove formally that any language model satisfying natural calibration conditions must hallucinate, at a rate approaching the fraction of facts that appear exactly once in the training data; subsequent work by shows that standard training and evaluation pipelines actively reward guessing over acknowledging uncertainty.

- [ ] checked

## leesee2004

**Trust in automation: Designing for appropriate reliance**  
Lee, J. D. and See, K. A. · Human Factors 2004  
<https://doi.org/10.1518/hfes.46.1.50_30392>

What the paper claims (1 place):

- This creates precisely the conditions described in Bainbridge's classic analysis of the ironies of automation and well-documented in the trust-in-automation literature: as automated systems become more reliable, human operators trust them more and monitor them less.

- [ ] checked

## llmon

**LLMON: An LLM-native Markup Language to Leverage Structure and Semantics at the LLM Interface**  
Hind, M. and Shbita, B. and Wu, B. and Ahmed, F. and DeLuca, C. and Fulton, N. and Cox, D. and Gutfreund, D. · arXiv:2603.22519 2026  
<https://arxiv.org/abs/2603.22519>

What the paper claims (1 place):

- LLMON carries structure and semantic metadata across the LLM interface, primarily to separate instructions from data; it structures the interface, whereas ProveML makes the output checkable.

- [ ] checked

## magesh2025

**Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools**  
Magesh, V. and Surani, F. and Dahl, M. and Suzgun, M. and Manning, C. D. and Ho, D. E. · Journal of Empirical Legal Studies 2025  
<https://doi.org/10.1111/jels.12413>

What the paper claims (1 place):

- RAG grounds responses in documents but models can still misrepresent retrieved context; found that the leading legal research tools --- Lexis+ AI and Thomson Reuters' Westlaw AI-Assisted Research and Ask Practical Law AI --- each hallucinate between 17\% and 33\% of the time, despite vendor claims of near-elimination.

- [ ] checked

## mata2023

**\textitMata v. Avianca, Inc.**  
U.S. District Court, S.D.N.Y. · 678 F.Supp.3d 443 2023  
<(no link in the entry)>

What the paper claims (1 place):

- Earlier, fabricated ChatGPT citations were submitted to a U.S.\ federal court, and a factual error in the launch demo materials for Google's Bard contributed to a \$100 billion market-cap drop.

- [ ] checked

## mccain2026

**Measuring AI Agent Autonomy in Practice**  
McCain, M. and Millar, T. and Huang, S. and Eaton, J. and Handa, K. and Stern, M. and others · Anthropic Research, \urlhttps://www.anthropic.com/research/measuring-agent-autonomy 2026  
<https://www.anthropic.com/research/measuring-agent-autonomy>

What the paper claims (1 place):

- report that roughly 73\% of agent tool calls on a major API still appear to retain a human in the loop.

- [ ] checked

## mckinsey2025

**The state of AI**  
McKinsey \& Company · \urlhttps://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai 2025  
<https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai>

What the paper claims (1 place):

- Yet the majority of organizations now use AI in at least one function, and Gartner projected that over 80\% of enterprises would have used generative AI APIs or deployed generative AI-enabled applications by 2026.

- [ ] checked

## narrativelicense

**Narrative License and Model Sycophancy in LLM Summaries of Scientific Work**  
Isch, C. and Jennings, G. · Proc. ACL 2026  
<https://doi.org/10.18653/v1/2026.acl-long.746>

What the paper claims (1 place):

- Registry as vocabulary constraint. Qualitative wording is where overreach actually happens: measure causal overreach and rhetorical confidence in LLM summaries relative to their sources, finding the drift is rhetorical rather than factual --- exactly the surface a value-only verifier leaves unguarded.

- [ ] checked

## naviskore

**Designing curriculum-aligned digital assessment infrastructures: a design-based case study of Naviskore in Flemish secondary education**  
Moortgat, Rony and Deconinck, Shane · Frontiers in Education 2026  
<https://doi.org/10.3389/feduc.2026.1856724>

What the paper claims (1 place):

- The first is generated, in the shape of a curriculum-aligned assessment platform in Flemish secondary education: 741 pupils across 95 class offerings, each pupil carrying a mastery level per curriculum goal, plus the aggregates such a platform reports.

- [ ] checked

## nemo

**NeMo Guardrails: A Toolkit for Controllable and Safe LLM Applications with Programmable Rails**  
Rebedea, T. and Dinu, R. and Sreedhar, M. and Parisien, C. and Cohen, J. · Proc. EMNLP System Demonstrations 2023  
<https://doi.org/10.18653/v1/2023.emnlp-demo.40>

What the paper claims (1 place):

- Output validation (Guardrails AI, DSPy, NeMo Guardrails ): programmatic constraint enforcement that can operate at output or sentence level.

- [ ] checked

## omnibus2026

**Regulation (EU) 2026/1744 of 8 July 2026 amending Regulations (EU) 2024/1689, (EU) 2018/1139 and (EU) 2023/1230 as regards the simplification of the implementation of harmonised rules on artificial intelligence (Digital Omnibus on AI)**  
European Parliament and Council of the European Union · Official Journal of the European Union, \urlhttps://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng 2026  
<https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng>

What the paper claims (1 place):

- The 2026 Digital Omnibus deferred those stand-alone high-risk obligations to 2 December 2027 (and to 2 August 2028 for AI embedded in regulated products) while leaving the Article 50 transparency duties in force from 2 August 2026 --- a deferral that buys providers and deployers time to build verifiable-claim infrastructure rather than removing the need for it.

- [ ] checked

## oraclegen

**Oracle-Augmented Generation: Connecting AI to Real-Time Verifiable Data**  
Kamu Data · \urlhttps://www.kamu.dev/blog/2025-01-08-oracle-augmented-generation/ 2025  
<https://www.kamu.dev/blog/2025-01-08-oracle-augmented-generation/>

What the paper claims (1 place):

- Kamu Data's Oracle-Augmented Generation delegates computation to a deterministic query engine with cryptographic provenance.

- [ ] checked

## orgad2025

**LLMs Know More Than They Show: On the Intrinsic Representation of LLM Hallucinations**  
Orgad, H. and Toker, M. and Gekhman, Z. and Reichart, R. and Szpektor, I. and Kotek, H. and Belinkov, Y. · Proc. ICLR 2025  
<https://arxiv.org/abs/2410.02707>

What the paper claims (1 place):

- Emerging interpretability research can detect some internal uncertainty signals, but probes do not generalize across tasks, entropy methods fail on confident errors, and probing methods require white-box access.

- [ ] checked

## ouyang2022

**Training language models to follow instructions with human feedback**  
Ouyang, L. and others · Proc. NeurIPS 2022  
<https://arxiv.org/abs/2203.02155>

What the paper claims (1 place):

- Current mitigations reduce hallucination rates but cannot eliminate them. RLHF improves instruction-following and truthfulness.

- [ ] checked

## parasuraman1997

**Humans and automation: Use, misuse, disuse, abuse**  
Parasuraman, R. and Riley, V. · Human Factors 1997  
<https://doi.org/10.1518/001872097778543886>

What the paper claims (1 place):

- This creates precisely the conditions described in Bainbridge's classic analysis of the ironies of automation and well-documented in the trust-in-automation literature: as automated systems become more reliable, human operators trust them more and monitor them less.

- [ ] checked

## pcc

**Proof-Carrying Code**  
Necula, G. C. · Proc. POPL 1997  
<https://doi.org/10.1145/263699.263712>

What the paper claims (1 place):

- Proof-Carrying Code embeds machine-checkable safety proofs in executable code.

- [ ] checked

## pcn2025

**Proof-Carrying Numbers (PCN): A Protocol for Trustworthy Numeric Answers from LLMs via Claim Verification**  
Solatorio, Aivin V. · arXiv:2509.06902 2025  
<https://arxiv.org/abs/2509.06902>

What the paper claims (2 places):

- We baseline against SymGen rather than the nearer neighbour, Proof-Carrying Numbers, for a specific reason: SymGen's mechanism is fully specified in its paper down to the delimiter, so a faithful reimplementation is possible from the published description alone.
- Proof-Carrying Numbers is the closest recent neighbour: the LLM emits claim-bound tokens tying numeric spans to structured claims, verified deterministically in the renderer with explicit status marks and tolerance policies; it lacks entity scoping and a composable threshold registry.

- [ ] checked

## pml

**A proof markup language for Semantic Web services**  
Pinheiro da Silva, Paulo and McGuinness, Deborah L. and Fikes, Richard · Information Systems 2006  
<https://doi.org/10.1016/j.is.2005.02.003>

What the paper claims (1 place):

- We present ProveML (Provable Markup Language), a system that fills this gap. (The name is distinct from the earlier DARPA-era Proof/Provenance Markup Language, PML, an interlingua for representing proof and provenance metadata; ProveML shares neither its lineage nor its mechanism.) ProveML is an inline claim markup language embedded in AI-generated text where: itemize Every entity reference is verified against a structured data store (name match).

- [ ] checked

## prov

**PROV-O: The PROV Ontology**  
Lebo, T. and Sahoo, S. and McGuinness, D. and others · W3C Recommendation, \urlhttps://www.w3.org/TR/prov-o/ 2013  
<https://www.w3.org/TR/prov-o/>

What the paper claims (1 place):

- Provenance standards. W3C PROV-O and C2PA provide document-level provenance metadata.

- [ ] checked

## rarr

**RARR: Researching and Revising What Language Models Say, Using Language Models**  
Gao, L. and Dai, Z. and Pasupat, P. and Chen, A. and Chaganty, A. T. and Fan, Y. and Zhao, V. and Lao, N. and Lee, H. and Juan, D. and Guu, K. · Proc. ACL 2023  
<https://doi.org/10.18653/v1/2023.acl-long.910>

What the paper claims (2 places):

- Attribution (RARR, WebGPT, OpenAI response annotations): link claims to source documents or passages.
- RARR and WebGPT attach URLs.

- [ ] checked

## rdfa

**RDFa 1.1 Primer --- Third Edition**  
W3C · W3C Working Group Note, \urlhttps://www.w3.org/TR/rdfa-primer/ 2015  
<https://www.w3.org/TR/rdfa-primer/>

What the paper claims (1 place):

- RDFa adds attributes to HTML that bind spans of prose to entities and properties in a structured vocabulary, resolvable without reading the prose --- the same shape of idea, developed for documents people wrote themselves.

- [ ] checked

## refchecker

**Knowledge-Centric Hallucination Detection**  
Hu, Xiangkun and Ru, Dongyu and Qiu, Lin and Guo, Qipeng and Zhang, Tianhang and Xu, Yang and Luo, Yun and Liu, Pengfei and Zhang, Yue and Zhang, Zheng · Proc. EMNLP 2024  
<https://doi.org/10.18653/v1/2024.emnlp-main.395>

What the paper claims (2 places):

- Current approaches to the AI reliability problem include several strategies, none of which addresses the structural verification gap: enumerate Post-hoc fact-checking (FActScore, SAFE, FacTool, SelfCheckGPT, RefChecker ): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals.
- RefChecker extracts claim triplets for reference-based checking.

- [ ] checked

## safe

**Long-form factuality in large language models**  
Wei, J. and Yang, C. and Song, X. and Lu, Y. and Hu, N. and Huang, J. and Tran, D. and Peng, D. and Liu, R. and Huang, D. and Du, C. and Le, Q. V. · Proc. NeurIPS 2024  
<https://arxiv.org/abs/2403.18802>

What the paper claims (2 places):

- Current approaches to the AI reliability problem include several strategies, none of which addresses the structural verification gap: enumerate Post-hoc fact-checking (FActScore, SAFE, FacTool, SelfCheckGPT, RefChecker ): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals.
- Post-hoc fact-checking (AI in the loop). FActScore, SAFE, FacTool, and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search.

- [ ] checked

## santillana2026

**Precision Is Not Faithfulness: Coverage-Aware Evaluation of Grounded Generation with a Complete Oracle**  
Santillana, J. S. · arXiv:2606.09376 2026  
<https://arxiv.org/abs/2606.09376>

What the paper claims (1 place):

- reach the same conclusion from the evaluation side, showing that reference-free faithfulness metrics measure only precision over stated claims and therefore reward abstention; they pair precision with recall against a completely derived oracle.

- [ ] checked

## selfcheckgpt

**SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models**  
Manakul, P. and Liusie, A. and Gales, M. J. F. · Proc. EMNLP 2023  
<https://doi.org/10.18653/v1/2023.emnlp-main.557>

What the paper claims (2 places):

- Current approaches to the AI reliability problem include several strategies, none of which addresses the structural verification gap: enumerate Post-hoc fact-checking (FActScore, SAFE, FacTool, SelfCheckGPT, RefChecker ): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals.
- SelfCheckGPT detects hallucinations via sampling consistency without external knowledge.

- [ ] checked

## symgen

**Towards Verifiable Text Generation with Symbolic References**  
Torroba Hennigen, L. and Shen, S. Z. and Nrusimha, A. and Gapp, B. and Sontag, D. and Kim, Y. · Proc. COLM 2024  
<https://arxiv.org/abs/2311.09188>

What the paper claims (3 places):

- Baseline: Substitution versus Verification sec:symgen Setup. SymGen is the closest published mechanism, and it takes the opposite strategy: the model emits Jinja-like \\ field \\ references into the conditioning data and a parser substitutes each one, so the model never states a value itself.
- SymGen embeds symbolic references in AI-generated text that are resolved against table data.
- We have not measured whether this reduces human verification effort, and the evidence from adjacent systems is mixed: report their user study reduced average verification time by 20\%, while report a 21-participant study in which verification and correction effort did not differ significantly from their baseline, even though their system reduced hallucination.

- [ ] checked

## tabfact

**TabFact: A Large-scale Dataset for Table-based Fact Verification**  
Chen, W. and Wang, H. and Chen, J. and Zhang, Y. and Wang, H. and Li, S. and Zhou, X. and Wang, W. Y. · Proc. ICLR 2020  
<https://arxiv.org/abs/1909.02164>

What the paper claims (1 place):

- Data-grounded generation. Fact verification against evidence has a canonical benchmark lineage --- FEVER for textual sources, TabFact for tables, FEVEROUS for both at once --- in which a trained model judges whether evidence supports a claim; ProveML sits outside that lineage by making the judgment a lookup rather than a model.

- [ ] checked

## ten2026

**TEN: Table Explicitization, Neurosymbolically**  
Mehrotra, N. and Kumar, A. and Gulwani, S. and Radhakrishna, A. and Tiwari, A. · Proc. ACL Industry Track 2026  
<https://doi.org/10.18653/v1/2026.acl-industry.138>

What the paper claims (1 place):

- We have not measured whether this reduces human verification effort, and the evidence from adjacent systems is mixed: report their user study reduced average verification time by 20\%, while report a 21-participant study in which verification and correction effort did not differ significantly from their baseline, even though their system reduced hallucination.

- [ ] checked

## toolgate

**ToolGate: Contract-Grounded and Verified Tool Execution for LLMs**  
Liu, Y. and Peng, X. and Cao, J. and Wang, X. and Deng, S. and Chen, J. and Yin, J. and Zhang, X. · Findings of ACL 2026  
<https://doi.org/10.18653/v1/2026.findings-acl.470>

What the paper claims (2 places):

- That sweep found systems that bind claims to evidence contracts, emit provenance triples, or maintain typed key-value state with non-probabilistic admission, but none that extends an authoring format with inline claim markup, and none that constrains qualitative wording through a declared threshold vocabulary.
- Design philosophy. ProveML is deliberately assembled from established patterns rather than invented from scratch: itemize[nosep] Host language: Markdown (natively produced by LLMs) Inline tagging model from iXBRL Operator vocabulary from FHIR clinical reference ranges and JSON Schema validation Fact store from the Entity-Attribute-Value (EAV) pattern; arrive at a comparable typed key-value state with a non-probabilistic admission check, in the agent/tool setting rather than in text Verify-then-render pipeline from standard compiler design itemize A skeptical reader should find each component familiar.

- [ ] checked

## totto

**ToTTo: A Controlled Table-To-Text Generation Dataset**  
Parikh, A. and Wang, X. and Gehrmann, S. and Faruqui, M. and Dhingra, B. and Yang, D. and Das, D. · Proc. EMNLP 2020  
<https://doi.org/10.18653/v1/2020.emnlp-main.89>

What the paper claims (1 place):

- The data-to-text community and StructFact (ACL 2025 Findings) benchmark faithful generation from structured data.

- [ ] checked

## verifiableprm

**Beyond Outcome Verification: Verifiable Process Reward Models for Structured Reasoning**  
Pronesti, M. and Belz, A. and Hou, Y. · Findings of ACL 2026  
<https://doi.org/10.18653/v1/2026.findings-acl.1611>

What the paper claims (1 place):

- make the same architectural argument we do, in the reasoning-step setting: they replace neural judges over chain-of-thought with rule-based verifiers precisely because model judges are opaque and reward-hackable.

- [ ] checked

## webgpt

**WebGPT: Browser-assisted question-answering with human feedback**  
Nakano, R. and others · arXiv:2112.09332 2021  
<https://arxiv.org/abs/2112.09332>

What the paper claims (2 places):

- Attribution (RARR, WebGPT, OpenAI response annotations): link claims to source documents or passages.
- RARR and WebGPT attach URLs.

- [ ] checked

## xu2024

**Hallucination is Inevitable: An Innate Limitation of Large Language Models**  
Xu, Z. and Jain, S. and Kankanhalli, M. · arXiv:2401.11817 2024  
<https://arxiv.org/abs/2401.11817>

What the paper claims (1 place):

- use computability theory to show that LLMs cannot learn all computable functions and will therefore inevitably produce confabulations when used as general-purpose reasoners.

- [ ] checked

---

## Not cited in prose

These appear only in the bibliography — either cite them or drop them:

- `alignscore` — AlignScore: Evaluating Factual Consistency with A Unified Alignment Function
- `minicheck` — MiniCheck: Efficient Fact-Checking of LLMs on Grounding Documents
- `picard` — PICARD: Parsing Incrementally for Constrained Auto-Regressive Decoding from Language Models
- `summac` — SummaC: Re-Visiting NLI-based Models for Inconsistency Detection in Summarization
- `synchromesh` — Synchromesh: Reliable code generation from pre-trained language models
