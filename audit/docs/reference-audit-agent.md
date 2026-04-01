# ProveML Reference Audit (Agent Export)

This is the compact agent-facing export of the reference audit.
Use it instead of the HTML page when you want structured citation review without UI markup.

## Totals

- Total references: 43
- Cited in paper: 37
- Source passages curated: 0
- Summary reviewed: 0
- Auto summary candidates: 27
- Exact rendered blocks: 75

## Highest-Attention References

None.

## Records

### kalai2024
Calibrated Language Models Must Hallucinate
- authors: Kalai, A. T. and Vempala, S. S.
- year: 2024
- venue: Proc. STOC
- source url: https://arxiv.org/abs/2311.14648
- source label: references/raw/kalai2024.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 117: Recent theoretical work establishes that hallucination is not a bug but a structural property of how language models operate. [kalai2024] prove formally that any language model satisfying natural calibration conditions must hallucinate, at a rate bounded by the number of facts appearing rarely in training data; subsequent work [kalai2025] shows that standard training and evaluation pipelines actively reward guessing over acknowledging uncertainty. [xu2024] use computability theory to show that LLMs cannot learn all computable functions and will therefore inevitably produce confabulations when used as general-purpose reasoners. More broadly, hallucination is a well-documented reliability problem across deep-learning-based natural language generation systems [ji2023].

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Recent language models generate false but plausible-sounding text with surprising frequency. Such &#34;hallucinations&#34; are an obstacle to the usability of language-based AI systems and can harm people who rely upon their outputs. This work shows that there is an inherent statistical lower-bound on the rate that pretrained language models hallucinate certain types of facts, having nothing to do with the transformer LM architecture or data quality.…

### kalai2025
Why Language Models Hallucinate
- authors: Kalai, A. T. and Nachum, O. and Vempala, S. S. and Zhang, E.
- year: 2025
- venue: Unknown
- source url: https://arxiv.org/abs/2509.04664
- source label: references/raw/kalai2025.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 117: Recent theoretical work establishes that hallucination is not a bug but a structural property of how language models operate. [kalai2024] prove formally that any language model satisfying natural calibration conditions must hallucinate, at a rate bounded by the number of facts appearing rarely in training data; subsequent work [kalai2025] shows that standard training and evaluation pipelines actively reward guessing over acknowledging uncertainty. [xu2024] use computability theory to show that LLMs cannot learn all computable functions and will therefore inevitably produce confabulations when used as general-purpose reasoners. More broadly, hallucination is a well-documented reliability problem across deep-learning-based natural language generation systems [ji2023].

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Like students facing hard exam questions, large language models sometimes guess when uncertain, producing plausible yet incorrect statements instead of admitting uncertainty. Such &#34;hallucinations&#34; persist even in state-of-the-art systems and undermine trust. We argue that language models hallucinate because the training and evaluation procedures reward guessing over acknowledging uncertainty, and we analyze the statistical causes of hallucinations in the modern training pipeline.…

### xu2024
Hallucination is Inevitable: An Innate Limitation of Large Language Models
- authors: Xu, Z. and Jain, S. and Kankanhalli, M.
- year: 2025
- venue: Proc. ICLR
- source url: https://arxiv.org/abs/2401.11817
- source label: references/raw/xu2024.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 117: Recent theoretical work establishes that hallucination is not a bug but a structural property of how language models operate. [kalai2024] prove formally that any language model satisfying natural calibration conditions must hallucinate, at a rate bounded by the number of facts appearing rarely in training data; subsequent work [kalai2025] shows that standard training and evaluation pipelines actively reward guessing over acknowledging uncertainty. [xu2024] use computability theory to show that LLMs cannot learn all computable functions and will therefore inevitably produce confabulations when used as general-purpose reasoners. More broadly, hallucination is a well-documented reliability problem across deep-learning-based natural language generation systems [ji2023].

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Hallucination has been widely recognized to be a significant drawback for large language models (LLMs). There have been many works that attempt to reduce the extent of hallucination. These efforts have mostly been empirical so far, which cannot answer the fundamental question whether it can be completely eliminated. In this paper, we formalize the problem and show that it is impossible to eliminate hallucination in LLMs.…

### ji2023
Survey of Hallucination in Natural Language Generation
- authors: Ji, Z. and Lee, N. and Frieske, R. and Yu, T. and Su, D. and Xu, Y. and Ishii, E. and Bang, Y. J. and Madotto, A. and Fung, P.
- year: 2023
- venue: ACM Computing Surveys
- source url: https://doi.org/10.1145/3571730
- source label: references/raw/ji2023.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 117: Recent theoretical work establishes that hallucination is not a bug but a structural property of how language models operate. [kalai2024] prove formally that any language model satisfying natural calibration conditions must hallucinate, at a rate bounded by the number of facts appearing rarely in training data; subsequent work [kalai2025] shows that standard training and evaluation pipelines actively reward guessing over acknowledging uncertainty. [xu2024] use computability theory to show that LLMs cannot learn all computable functions and will therefore inevitably produce confabulations when used as general-purpose reasoners. More broadly, hallucination is a well-documented reliability problem across deep-learning-based natural language generation systems [ji2023].

Source passages:
- None

Summary passages:
- [normalized] first paragraph :: Research output : Contribution to journal › Review article › peer-review

### orgad2025
LLMs Know More Than They Show
- authors: Orgad, H. and Toker, M. and Slobodkin, A. and Belinkov, Y.
- year: 2025
- venue: Proc. ICLR
- source url: https://arxiv.org/abs/2410.02707
- source label: references/raw/orgad2025.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 119: Current mitigations reduce hallucination rates but cannot eliminate them. RLHF improves instruction-following and truthfulness [ouyang2022]. Even so, aligned models may still produce confident-sounding but incorrect responses. RAG grounds responses in documents but models can still misrepresent retrieved context; [magesh2025] found hallucination rates exceeding 17% in both Lexis+ AI and Westlaw AI-Assisted Research, despite vendor claims of near-elimination. Emerging interpretability research can detect some internal uncertainty signals [orgad2025, farquhar2024], but probes do not generalise across tasks, entropy methods fail on confident errors, and all require white-box access. [mccain2026] report that 73% of agent tool calls still involve human oversight, finding that agents systematically overestimate their own success rates.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Large language models (LLMs) often produce errors, including factual inaccuracies, biases, and reasoning failures, collectively referred to as &#34;hallucinations&#34;. Recent studies have demonstrated that LLMs' internal states encode information regarding the truthfulness of their outputs, and that this information can be utilized to detect errors. In this work, we show that the internal representations of LLMs encode much more information about truthfulness than previously recognized.…

### farquhar2024
Detecting hallucinations in large language models using semantic entropy
- authors: Farquhar, S. and Kossen, J. and Kuhn, L. and Gal, Y.
- year: 2024
- venue: Nature
- source url: https://doi.org/10.1038/s41586-024-07421-0
- source label: references/raw/farquhar2024.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 119: Current mitigations reduce hallucination rates but cannot eliminate them. RLHF improves instruction-following and truthfulness [ouyang2022]. Even so, aligned models may still produce confident-sounding but incorrect responses. RAG grounds responses in documents but models can still misrepresent retrieved context; [magesh2025] found hallucination rates exceeding 17% in both Lexis+ AI and Westlaw AI-Assisted Research, despite vendor claims of near-elimination. Emerging interpretability research can detect some internal uncertainty signals [orgad2025, farquhar2024], but probes do not generalise across tasks, entropy methods fail on confident errors, and all require white-box access. [mccain2026] report that 73% of agent tool calls still involve human oversight, finding that agents systematically overestimate their own success rates.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Hallucinations (confabulations) in large language model systems can be tackled by measuring uncertainty about the meanings of generated responses rather than the text itself&nbsp;to improve question-answering accuracy.

### mccain2026
Measuring AI Agent Autonomy in Practice
- authors: McCain, M. and Millar, T. and Huang, S. and Eaton, J. and Handa, K. and Stern, M. and others
- year: 2026
- venue: Unknown
- source url: https://www.anthropic.com/research/measuring-agent-autonomy
- source label: references/raw/mccain2026.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 119: Current mitigations reduce hallucination rates but cannot eliminate them. RLHF improves instruction-following and truthfulness [ouyang2022]. Even so, aligned models may still produce confident-sounding but incorrect responses. RAG grounds responses in documents but models can still misrepresent retrieved context; [magesh2025] found hallucination rates exceeding 17% in both Lexis+ AI and Westlaw AI-Assisted Research, despite vendor claims of near-elimination. Emerging interpretability research can detect some internal uncertainty signals [orgad2025, farquhar2024], but probes do not generalise across tasks, entropy methods fail on confident errors, and all require white-box access. [mccain2026] report that 73% of agent tool calls still involve human oversight, finding that agents systematically overestimate their own success rates.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Anthropic is an AI safety and research company that&#x27;s working to build reliable, interpretable, and steerable AI systems.

### ouyang2022
Training language models to follow instructions with human feedback
- authors: Ouyang, L. and others
- year: 2022
- venue: Proc. NeurIPS
- source url: https://arxiv.org/abs/2203.02155
- source label: references/raw/ouyang2022.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 119: Current mitigations reduce hallucination rates but cannot eliminate them. RLHF improves instruction-following and truthfulness [ouyang2022]. Even so, aligned models may still produce confident-sounding but incorrect responses. RAG grounds responses in documents but models can still misrepresent retrieved context; [magesh2025] found hallucination rates exceeding 17% in both Lexis+ AI and Westlaw AI-Assisted Research, despite vendor claims of near-elimination. Emerging interpretability research can detect some internal uncertainty signals [orgad2025, farquhar2024], but probes do not generalise across tasks, entropy methods fail on confident errors, and all require white-box access. [mccain2026] report that 73% of agent tool calls still involve human oversight, finding that agents systematically overestimate their own success rates.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Making language models bigger does not inherently make them better at following a user's intent. For example, large language models can generate outputs that are untruthful, toxic, or simply not helpful to the user. In other words, these models are not aligned with their users. In this paper, we show an avenue for aligning language models with user intent on a wide range of tasks by fine-tuning with human feedback.…

### magesh2025
Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools
- authors: Magesh, V. and Suber, F. and Doshi, N. and Cabral, M. and Arriaga, A. and Ho, D. E.
- year: 2025
- venue: Journal of Empirical Legal Studies
- source url: https://doi.org/10.1111/jels.12413
- source label: references/raw/magesh2025.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 119: Current mitigations reduce hallucination rates but cannot eliminate them. RLHF improves instruction-following and truthfulness [ouyang2022]. Even so, aligned models may still produce confident-sounding but incorrect responses. RAG grounds responses in documents but models can still misrepresent retrieved context; [magesh2025] found hallucination rates exceeding 17% in both Lexis+ AI and Westlaw AI-Assisted Research, despite vendor claims of near-elimination. Emerging interpretability research can detect some internal uncertainty signals [orgad2025, farquhar2024], but probes do not generalise across tasks, entropy methods fail on confident errors, and all require white-box access. [mccain2026] report that 73% of agent tool calls still involve human oversight, finding that agents systematically overestimate their own success rates.

Source passages:
- None

Summary passages:
- [normalized] first paragraph :: Varun Magesh, Faiz Surani, Matthew Dahl, Mirac Suzgun, Christopher D. Manning, and Daniel E. Ho

### mata2023
textitMata v. Avianca, Inc.
- authors: U.S. District Court, S.D.N.Y.
- year: 2023
- venue: Unknown
- source url: None
- source label: None
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 121: Meanwhile, the consequences are real and adoption is accelerating. In 2025, Deloitte delivered a government report with AI-fabricated citations [deloitte2025]. Earlier, fabricated ChatGPT citations were submitted to a U.S. federal court [mata2023], and Google's first Bard demo hallucinated on camera, contributing to a $100 billion market cap drop [googlebard2023]. Yet the majority of organisations now use AI in at least one function [mckinsey2025], and Gartner projected over 80% of enterprises would deploy generative AI by 2026 [gartner2023]. Organisations are not waiting for hallucination to be solved; they are deploying now and managing the risk.

Source passages:
- None

Summary passages:
- None

### deloitte2025
Deloitte AI report for Australian government contained fabricated citations
- authors: Rudge, C.
- year: 2025
- venue: Unknown
- source url: https://fortune.com/2025/10/07/deloitte-ai-australia-government-report-hallucinations-technology-290000-refund/
- source label: references/raw/deloitte2025.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 121: Meanwhile, the consequences are real and adoption is accelerating. In 2025, Deloitte delivered a government report with AI-fabricated citations [deloitte2025]. Earlier, fabricated ChatGPT citations were submitted to a U.S. federal court [mata2023], and Google's first Bard demo hallucinated on camera, contributing to a $100 billion market cap drop [googlebard2023]. Yet the majority of organisations now use AI in at least one function [mckinsey2025], and Gartner projected over 80% of enterprises would deploy generative AI by 2026 [gartner2023]. Organisations are not waiting for hallucination to be solved; they are deploying now and managing the risk.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: The updates “in no way impact” the report’s findings and recommendations, the Big Four firm said.

### googlebard2023
Google's AI chatbot Bard makes factual error in first demo
- authors: Elias, P.
- year: 2023
- venue: Unknown
- source url: None
- source label: None
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 121: Meanwhile, the consequences are real and adoption is accelerating. In 2025, Deloitte delivered a government report with AI-fabricated citations [deloitte2025]. Earlier, fabricated ChatGPT citations were submitted to a U.S. federal court [mata2023], and Google's first Bard demo hallucinated on camera, contributing to a $100 billion market cap drop [googlebard2023]. Yet the majority of organisations now use AI in at least one function [mckinsey2025], and Gartner projected over 80% of enterprises would deploy generative AI by 2026 [gartner2023]. Organisations are not waiting for hallucination to be solved; they are deploying now and managing the risk.

Source passages:
- None

Summary passages:
- None

### mckinsey2025
The state of AI
- authors: McKinsey & Company
- year: 2025
- venue: Unknown
- source url: https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai
- source label: https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 121: Meanwhile, the consequences are real and adoption is accelerating. In 2025, Deloitte delivered a government report with AI-fabricated citations [deloitte2025]. Earlier, fabricated ChatGPT citations were submitted to a U.S. federal court [mata2023], and Google's first Bard demo hallucinated on camera, contributing to a $100 billion market cap drop [googlebard2023]. Yet the majority of organisations now use AI in at least one function [mckinsey2025], and Gartner projected over 80% of enterprises would deploy generative AI by 2026 [gartner2023]. Organisations are not waiting for hallucination to be solved; they are deploying now and managing the risk.

Source passages:
- None

Summary passages:
- None

### gartner2023
More Than 80% of Enterprises Will Have Used Generative AI APIs or Deployed Generative AI-Enabled Applications by 2026
- authors: Gartner
- year: 2023
- venue: Unknown
- source url: https://www.gartner.com/en/newsroom/press-releases/2023-10-11-gartner-says-more-than-80-percent-of-enterprises-will-have-used-generative-ai-apis-or-deployed-generative-ai-enabled-applications-by-2026?src_trk=em6750807b0c4706.147509061378393647
- source label: https://www.gartner.com/en/newsroom/press-releases/2023-10-11-gartner-says-more-than-80-percent-of-enterprises-will-have-used-generative-ai-apis-or-deployed-generative-ai-enabled-applications-by-2026?src_trk=em6750807b0c4706.147509061378393647
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 121: Meanwhile, the consequences are real and adoption is accelerating. In 2025, Deloitte delivered a government report with AI-fabricated citations [deloitte2025]. Earlier, fabricated ChatGPT citations were submitted to a U.S. federal court [mata2023], and Google's first Bard demo hallucinated on camera, contributing to a $100 billion market cap drop [googlebard2023]. Yet the majority of organisations now use AI in at least one function [mckinsey2025], and Gartner projected over 80% of enterprises would deploy generative AI by 2026 [gartner2023]. Organisations are not waiting for hallucination to be solved; they are deploying now and managing the risk.

Source passages:
- None

Summary passages:
- None

### bainbridge1983
Ironies of automation
- authors: Bainbridge, L.
- year: 1983
- venue: Automatica
- source url: None
- source label: None
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 123: This creates precisely the conditions described in Bainbridge's classic analysis of the ironies of automation [bainbridge1983] and well-documented in the trust-in-automation literature [leesee2004, parasuraman1997]: as automated systems become more reliable, human operators trust them more and monitor them less. When the rare failure occurs, it is more likely to go undetected precisely because the operator has become complacent. In the context of AI-generated text, this dynamic is particularly acute. An LLM that produces correct output 97% of the time creates a more dangerous situation than one that produces correct output 80% of the time, because the 97% system induces trust that suppresses human verification behaviour.

Source passages:
- None

Summary passages:
- None

### leesee2004
Trust in automation: Designing for appropriate reliance
- authors: Lee, J. D. and See, K. A.
- year: 2004
- venue: Human Factors
- source url: https://doi.org/10.1518/hfes.46.1.50_30392
- source label: references/raw/leesee2004.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 123: This creates precisely the conditions described in Bainbridge's classic analysis of the ironies of automation [bainbridge1983] and well-documented in the trust-in-automation literature [leesee2004, parasuraman1997]: as automated systems become more reliable, human operators trust them more and monitor them less. When the rare failure occurs, it is more likely to go undetected precisely because the operator has become complacent. In the context of AI-generated text, this dynamic is particularly acute. An LLM that produces correct output 97% of the time creates a more dangerous situation than one that produces correct output 80% of the time, because the 97% system induces trust that suppresses human verification behaviour.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Automation is often problematic because people fail to rely upon it appropriately. Because people respond to technology socially, trust influences reliance on automation. In particular, trust guides reliance when complexity and unanticipated situations make a complete understanding of the automation …

### parasuraman1997
Humans and automation: Use, misuse, disuse, abuse
- authors: Parasuraman, R. and Riley, V.
- year: 1997
- venue: Human Factors
- source url: https://doi.org/10.1518/001872097778543886
- source label: https://doi.org/10.1518/001872097778543886
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 123: This creates precisely the conditions described in Bainbridge's classic analysis of the ironies of automation [bainbridge1983] and well-documented in the trust-in-automation literature [leesee2004, parasuraman1997]: as automated systems become more reliable, human operators trust them more and monitor them less. When the rare failure occurs, it is more likely to go undetected precisely because the operator has become complacent. In the context of AI-generated text, this dynamic is particularly acute. An LLM that produces correct output 97% of the time creates a more dangerous situation than one that produces correct output 80% of the time, because the 97% system induces trust that suppresses human verification behaviour.

Source passages:
- None

Summary passages:
- None

### euaiact
Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act)
- authors: European Parliament
- year: 2024
- venue: Unknown
- source url: https://eur-lex.europa.eu/eli/reg/2024/1689/
- source label: https://eur-lex.europa.eu/eli/reg/2024/1689/
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 125: The regulatory landscape compounds the problem. The EU AI Act [euaiact] classifies AI systems used for consequential decisions as "high-risk" (Annex III), requiring transparency, human oversight, and risk management. Yet to our knowledge, no existing framework combines inline claim markup, deterministic mismatch detection against structured data, and composable threshold inference in a single system.

Source passages:
- None

Summary passages:
- None

### factscore
FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation
- authors: Min, S. and Krishna, K. and Lyu, X. and Lewis, M. and Yih, W. and Koh, P. and Iyyer, M. and Zettlemoyer, L. and Hajishirzi, H.
- year: 2023
- venue: Proc. EMNLP
- source url: None
- source label: references/raw/factscore.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 130: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 715: Post-hoc fact-checking (AI in the loop).. FActScore [factscore], SAFE [safe], FacTool [factool], and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search. ClaimVer (EMNLP 2024 Findings) adds explainability through knowledge graphs. SelfCheckGPT [selfcheckgpt] detects hallucinations via sampling consistency without external knowledge. RefChecker [refchecker] extracts claim triplets for reference-based checking. All use AI in the verification loop, making verification itself probabilistic. ProveML's verification is deterministic.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Evaluating the factuality of long-form text generated by large language models (LMs) is non-trivial because (1) generations often contain a mixture of supported and unsupported pieces of information, making binary judgments of quality inadequate, and (2) human evaluation is time-consuming and costly. In this paper, we introduce FACTSCORE, a new evaluation that breaks a generation into a series of atomic facts and computes the percentage of atomic facts supported by a reliable knowledge source.…

### safe
Long-form factuality in large language models
- authors: Wei, J. and Yang, C. and Wang, S. and Hou, L.
- year: 2024
- venue: arXiv:2403.18802
- source url: https://arxiv.org/abs/2403.18802
- source label: references/raw/safe.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 130: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 715: Post-hoc fact-checking (AI in the loop).. FActScore [factscore], SAFE [safe], FacTool [factool], and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search. ClaimVer (EMNLP 2024 Findings) adds explainability through knowledge graphs. SelfCheckGPT [selfcheckgpt] detects hallucinations via sampling consistency without external knowledge. RefChecker [refchecker] extracts claim triplets for reference-based checking. All use AI in the verification loop, making verification itself probabilistic. ProveML's verification is deterministic.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Large language models (LLMs) often generate content that contains factual errors when responding to fact-seeking prompts on open-ended topics. To benchmark a model's long-form factuality in open domains, we first use GPT-4 to generate LongFact, a prompt set comprising thousands of questions spanning 38 topics. We then propose that LLM agents can be used as automated evaluators for long-form factuality through a method which we call Search-Augmented Factuality Evaluator (SAFE).…

### factool
FacTool: Factuality Detection in Generative AI -- A Tool Augmented Framework for Multi-Task and Multi-Domain Scenarios
- authors: Chern, I-C. and Chern, S. and Chen, S. and Yuan, W. and Feng, K. and Zhou, C. and He, J. and Neubig, G. and Liu, P.
- year: 2023
- venue: arXiv:2307.13528
- source url: https://arxiv.org/abs/2307.13528
- source label: references/raw/factool.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 130: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 715: Post-hoc fact-checking (AI in the loop).. FActScore [factscore], SAFE [safe], FacTool [factool], and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search. ClaimVer (EMNLP 2024 Findings) adds explainability through knowledge graphs. SelfCheckGPT [selfcheckgpt] detects hallucinations via sampling consistency without external knowledge. RefChecker [refchecker] extracts claim triplets for reference-based checking. All use AI in the verification loop, making verification itself probabilistic. ProveML's verification is deterministic.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: The emergence of generative pre-trained models has facilitated the synthesis of high-quality text, but it has also posed challenges in identifying factual errors in the generated text. In particular: (1) A wider range of tasks now face an increasing risk of containing factual errors when handled by generative models. (2) Generated texts tend to be lengthy and lack a clearly defined granularity for individual facts. (3) There is a scarcity of explicit evidence available during the process of fact checking.…

### selfcheckgpt
SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models
- authors: Manakul, P. and Liusie, A. and Gales, M. J. F.
- year: 2023
- venue: Proc. EMNLP
- source url: https://openreview.net/forum?id=RwzFNbJ3Ez
- source label: references/raw/selfcheckgpt.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 130: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 715: Post-hoc fact-checking (AI in the loop).. FActScore [factscore], SAFE [safe], FacTool [factool], and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search. ClaimVer (EMNLP 2024 Findings) adds explainability through knowledge graphs. SelfCheckGPT [selfcheckgpt] detects hallucinations via sampling consistency without external knowledge. RefChecker [refchecker] extracts claim triplets for reference-based checking. All use AI in the verification loop, making verification itself probabilistic. ProveML's verification is deterministic.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Potsawee Manakul, Adian Liusie, Mark Gales. Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing. 2023.

### refchecker
Knowledge-Centric Hallucination Detection
- authors: Hu, Xiangkun and Ru, Dongyu and Qiu, Lin and Guo, Qipeng and Zhang, Tianhang and Xu, Yang and Luo, Yun and Liu, Pengfei and Zhang, Yue and Zhang, Zheng
- year: 2024
- venue: Proc. EMNLP
- source url: https://aclanthology.org/2024.emnlp-main.395/
- source label: references/raw/refchecker.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 130: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 715: Post-hoc fact-checking (AI in the loop).. FActScore [factscore], SAFE [safe], FacTool [factool], and OpenFactCheck (COLING 2025) decompose generated text into atomic claims and verify each using LLMs or web search. ClaimVer (EMNLP 2024 Findings) adds explainability through knowledge graphs. SelfCheckGPT [selfcheckgpt] detects hallucinations via sampling consistency without external knowledge. RefChecker [refchecker] extracts claim triplets for reference-based checking. All use AI in the verification loop, making verification itself probabilistic. ProveML's verification is deterministic.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Xiangkun Hu, Dongyu Ru, Lin Qiu, Qipeng Guo, Tianhang Zhang, Yang Xu, Yun Luo, Pengfei Liu, Yue Zhang, Zheng Zhang. Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing. 2024.

### dspy
DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines
- authors: Khattab, O. and Singhvi, A. and Maheshwari, P. and Zhang, Z. and Santhanam, K. and Vardhamanan, S. and Haq, S. and Sharma, A. and Joshi, T. T. and Moberley, H. and Jain, P. and Shi, Q. and Zaharia, M.
- year: 2024
- venue: Proc. ICLR
- source url: https://openreview.net/forum?id=PFS4ffN9Yx
- source label: https://openreview.net/forum?id=PFS4ffN9Yx
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 131: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.

Source passages:
- None

Summary passages:
- None

### guardrails
Guardrails: Adding reliable AI to applications
- authors: Guardrails AI
- year: 2024
- venue: Unknown
- source url: https://github.com/guardrails-ai/guardrails
- source label: references/raw/guardrails.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 131: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Adding guardrails to large language models. Contribute to guardrails-ai/guardrails development by creating an account on GitHub.

### nemo
NeMo Guardrails: A Toolkit for Programmable Guardrails for LLM-based Conversational Applications
- authors: NVIDIA
- year: 2023
- venue: arXiv:2310.10501
- source url: https://arxiv.org/abs/2310.10501
- source label: references/raw/nemo.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 131: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: NeMo Guardrails is an open-source toolkit for easily adding programmable guardrails to LLM-based conversational systems. Guardrails (or rails for short) are a specific way of controlling the output of an LLM, such as not talking about topics considered harmful, following a predefined dialogue path, using a particular language style, and more. There are several mechanisms that allow LLM providers and developers to add guardrails that are embedded into a specific model at training, e.g. using model alignment.…

### rarr
RARR: Researching and Revising What Language Models Say, Using Language Models
- authors: Gao, L. and Dai, Z. and Pasupat, P. and Chen, A. and Chaganty, A. T. and Fan, Y. and Zhao, V. and Lao, N. and Lee, H. and Juan, D. and Guu, K.
- year: 2023
- venue: Proc. ACL
- source url: None
- source label: references/raw/rarr.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 132: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 717: Attribution (where, not whether).. Anthropic's Citations API, OpenAI's response annotations, and Google's Vertex AI Grounding [googleground] link generated text to source documents or passages. Google's grounding API additionally returns support scores and claim-to-source metadata, though verification remains probabilistic. RARR [rarr] and WebGPT [webgpt] attach URLs. LAQuer (ACL 2025) and "Attribute First, then Generate" (ACL 2024) localise attributions to fine-grained source spans. These systems track where a claim came from, not whether the claimed value is correct. Verification, if any, is against unstructured text.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: Language models (LMs) now excel at many tasks such as few-shot learning, question answering, reasoning, and dialog. However, they sometimes generate unsupported or misleading content. A user cannot easily determine whether their outputs are trustworthy or not, because most LMs do not have any built-in mechanism for attribution to external evidence.…

### webgpt
WebGPT: Browser-assisted question-answering with human feedback
- authors: Nakano, R. and others
- year: 2021
- venue: arXiv:2112.09332
- source url: https://arxiv.org/abs/2112.09332
- source label: references/raw/webgpt.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 132: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 717: Attribution (where, not whether).. Anthropic's Citations API, OpenAI's response annotations, and Google's Vertex AI Grounding [googleground] link generated text to source documents or passages. Google's grounding API additionally returns support scores and claim-to-source metadata, though verification remains probabilistic. RARR [rarr] and WebGPT [webgpt] attach URLs. LAQuer (ACL 2025) and "Attribute First, then Generate" (ACL 2024) localise attributions to fine-grained source spans. These systems track where a claim came from, not whether the claimed value is correct. Verification, if any, is against unstructured text.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: We fine-tune GPT-3 to answer long-form questions using a text-based web-browsing environment, which allows the model to search and navigate the web. By setting up the task so that it can be performed by humans, we are able to train models on the task using imitation learning, and then optimize answer quality with human feedback. To make human evaluation of factual accuracy easier, models must collect references while browsing in support of their answers. We train and evaluate our models on ELI5, a dataset of questions asked by Reddit users.…

### googleground
Grounding with Google Search
- authors: Google
- year: 2024
- venue: Unknown
- source url: https://ai.google.dev/gemini-api/docs/grounding
- source label: references/raw/googleground.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 132: • Post-hoc fact-checking (FActScore [factscore], SAFE [safe], FacTool [factool], SelfCheckGPT [selfcheckgpt], RefChecker [refchecker]): decompose, sample, or re-check generated text after the fact against external sources or model-generated consistency signals. These systems use non-deterministic checks in the verification loop, making verification itself probabilistic and subject to many of the same failure modes as the generation process. • Output validation (Guardrails AI [guardrails], DSPy [dspy], NeMo Guardrails [nemo]): programmatic constraint enforcement that can operate at output or sentence level. Guardrails AI's provenance validators support sentence-level checks against source text; DSPy compiles declarative LM pipelines into optimized prompts. However, verification in these systems still relies on LLM judgments or embedding similarity, not deterministic checks against structured data stores with addressable paths. • Attribution (RARR [rarr], WebGPT [webgpt], OpenAI response annotations): link claims to source documents or passages. Some systems (e.g., Google's grounding API [googleground]) additionally return support scores and claim-to-source metadata. These track where a claim came from, not whether the claimed value is correct. Verification, where present, is probabilistic and against unstructured text.
- line 717: Attribution (where, not whether).. Anthropic's Citations API, OpenAI's response annotations, and Google's Vertex AI Grounding [googleground] link generated text to source documents or passages. Google's grounding API additionally returns support scores and claim-to-source metadata, though verification remains probabilistic. RARR [rarr] and WebGPT [webgpt] attach URLs. LAQuer (ACL 2025) and "Attribute First, then Generate" (ACL 2024) localise attributions to fine-grained source spans. These systems track where a claim came from, not whether the claimed value is correct. Verification, if any, is against unstructured text.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Ground your model's responses in real-time information from Google Search to improve factual accuracy and provide citations.

### ixbrl
Inline XBRL 1.1
- authors: XBRL International
- year: 2013
- venue: Unknown
- source url: https://www.xbrl.org/specification/inlinexbrl-part1/rec-2013-11-18/inlinexbrl-part1-rec-2013-11-18.html
- source label: references/raw/ixbrl.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 147: The closest structural analog is iXBRL (Inline XBRL) [ixbrl], which embeds machine-readable tags in human-readable financial reports, enabling automated audit of reported figures. ProveML extends this concept from human-authored financial text to AI-generated text across any domain, adding inference chains, entity scoping, and threshold registries (see Figure fig:symgen-vs-proveml for the architectural distinction).
- line 155: • Host language: Markdown (natively produced by LLMs) • Inline tagging model from iXBRL [ixbrl] • Operator vocabulary from FHIR clinical reference ranges [fhir] and JSON Schema validation • Fact store from the Entity-Attribute-Value (EAV) pattern • Verify-then-render pipeline from standard compiler design
- line 725: Inline tagging.. iXBRL [ixbrl] embeds machine-readable tags in human-readable financial reports, the closest structural analog to ProveML. SymGen [symgen] embeds symbolic references in AI-generated text that are resolved against table data. SymGen's strategy is error prevention: a parser substitutes placeholders with data values, so the AI never independently claims a value. ProveML's strategy is error detection: the AI claims values directly, and a verifier checks them (Figure fig:symgen-vs-proveml). SymGen cannot detect mismatches or audit existing text. ProveML adds entity scoping, a threshold registry, and composable inference chains.

Source passages:
- None

Summary passages:
- [normalized] first paragraph :: iXBRL, or Inline XBRL, is an open standard that enables a single document to provide both human-readable and structured, machine-readable data. iXBRL is used by millions of companies around the world to prepare financial statements in a format that provides the structured data that regulators and analysts require, whilst allowing preparers to retain full control over the layout and presentation of their report.

### fhir
FHIR (Fast Healthcare Interoperability Resources), Release 5
- authors: HL7 International
- year: 2023
- venue: Unknown
- source url: https://hl7.org/fhir/R5/
- source label: references/raw/fhir.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 156: • Host language: Markdown (natively produced by LLMs) • Inline tagging model from iXBRL [ixbrl] • Operator vocabulary from FHIR clinical reference ranges [fhir] and JSON Schema validation • Fact store from the Entity-Attribute-Value (EAV) pattern • Verify-then-render pipeline from standard compiler design
- line 256: The threshold registry draws on the design patterns of clinical reference ranges (HL7 FHIR [fhir]), JSON Schema validation, and monitoring alert systems (Grafana, Datadog). The common insight across these systems: domain experts think in named ranges with semantic labels, not in operator expressions. A clinician defines "normal glucose = 70–100 mg/dL", not "glucose >= 70 AND glucose <= 100".

Source passages:
- None

Summary passages:
- [normalized] first paragraph :: This page is part of the FHIR Specification (v5.0.0: R5 - STU ). This is the current published version in it's permanent home (it will always be available at this URL). For a full list of available versions, see the Directory of published versions . Page versions: R5 R4B R4 R3 R2

### totto
ToTTo: A Controlled Table-to-Text Generation Dataset
- authors: Parikh, A. and Wang, X. and Gehrmann, S. and Faruqui, M. and Dhingra, B. and Yang, D. and Das, D.
- year: 2020
- venue: Proc. EMNLP
- source url: https://aclanthology.org/2020.emnlp-main.89/
- source label: references/raw/totto.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 723: Data-grounded generation.. The data-to-text community [totto] and StructFact (ACL 2025 Findings) benchmark faithful generation from structured data. ClaimDB (arXiv, January 2026) is the first fact-verification benchmark over large structured databases, using executable SQL queries. Kamu Data's Oracle-Augmented Generation [oraclegen] delegates computation to a deterministic query engine with cryptographic provenance. These approaches verify at the query level; ProveML verifies at the claim level within natural language text.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: Ankur Parikh, Xuezhi Wang, Sebastian Gehrmann, Manaal Faruqui, Bhuwan Dhingra, Diyi Yang, Dipanjan Das. Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing (EMNLP). 2020.

### oraclegen
Oracle-Augmented Generation: Connecting AI to Real-Time Verifiable Data
- authors: Kamu Data
- year: 2025
- venue: Unknown
- source url: https://www.kamu.dev/blog/2025-01-08-oracle-augmented-generation/
- source label: references/raw/oraclegen.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 723: Data-grounded generation.. The data-to-text community [totto] and StructFact (ACL 2025 Findings) benchmark faithful generation from structured data. ClaimDB (arXiv, January 2026) is the first fact-verification benchmark over large structured databases, using executable SQL queries. Kamu Data's Oracle-Augmented Generation [oraclegen] delegates computation to a deterministic query engine with cryptographic provenance. These approaches verify at the query level; ProveML verifies at the claim level within natural language text.

Source passages:
- None

Summary passages:
- [normalized] Open Graph description :: The Challenge of Factual Data in LLMs Retrieval-Augmented Generation Introducing Oracle-Augmented Generation Example Interaction Current Limitations OAG vs. RAG OAG and Kamu for Data Supply Chain Verifiability Role of OAG in AI and Data Economy Future work In collaboration between Kamu and Brian we are excited to introduce a new technique for connecting LLM-based AI agents to verifiable data we call Oracle-Augmented Generation. You can find a quick overview of the technique in this video:

### symgen
Towards Verifiable Text Generation with Symbolic References
- authors: Hennigen, L. T. and Srivastava, S. and Deng, S. and Singh, M. and Bisk, Y.
- year: 2023
- venue: arXiv:2311.09188
- source url: https://arxiv.org/abs/2311.09188
- source label: references/raw/symgen.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 725: Inline tagging.. iXBRL [ixbrl] embeds machine-readable tags in human-readable financial reports, the closest structural analog to ProveML. SymGen [symgen] embeds symbolic references in AI-generated text that are resolved against table data. SymGen's strategy is error prevention: a parser substitutes placeholders with data values, so the AI never independently claims a value. ProveML's strategy is error detection: the AI claims values directly, and a verifier checks them (Figure fig:symgen-vs-proveml). SymGen cannot detect mismatches or audit existing text. ProveML adds entity scoping, a threshold registry, and composable inference chains.

Source passages:
- None

Summary passages:
- [normalized] citation abstract :: LLMs are vulnerable to hallucinations, and thus their outputs generally require laborious human verification for high-stakes applications. To this end, we propose symbolically grounded generation (SymGen) as a simple approach for enabling easier manual validation of an LLM's output. SymGen prompts an LLM to interleave its regular output text with explicit symbolic references to fields present in some conditioning data (e.g., a table in JSON format).…

### prov
PROV-O: The PROV Ontology
- authors: Lebo, T. and Sahoo, S. and McGuinness, D. and others
- year: 2013
- venue: Unknown
- source url: https://www.w3.org/TR/prov-o/
- source label: references/raw/prov.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 727: Provenance standards.. W3C PROV-O [prov] and C2PA [c2pa] provide document-level provenance metadata. Proof-Carrying Code [pcc] embeds machine-checkable safety proofs in executable code. ProveML borrows the principle that the producer embeds checkable evidence; the mechanisms differ entirely.

Source passages:
- None

Summary passages:
- None

### c2pa
C2PA Technical Specification
- authors: Coalition for Content Provenance and Authenticity
- year: 2022
- venue: Unknown
- source url: https://c2pa.org/specifications/
- source label: references/raw/c2pa.html
- snapshot status: fetched
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 727: Provenance standards.. W3C PROV-O [prov] and C2PA [c2pa] provide document-level provenance metadata. Proof-Carrying Code [pcc] embeds machine-checkable safety proofs in executable code. ProveML borrows the principle that the producer embeds checkable evidence; the mechanisms differ entirely.

Source passages:
- None

Summary passages:
- [normalized] first paragraph :: This work is licensed under a Creative Commons Attribution 4.0 International License .

### pcc
Proof-Carrying Code
- authors: Necula, G. C.
- year: 1997
- venue: Proc. POPL
- source url: None
- source label: None
- snapshot status: none
- audit status: bibliography-only
- summary alignment: not-reviewed
- selection risk: not-reviewed
- summary note: None

Paper excerpts:
- line 727: Provenance standards.. W3C PROV-O [prov] and C2PA [c2pa] provide document-level provenance metadata. Proof-Carrying Code [pcc] embeds machine-checkable safety proofs in executable code. ProveML borrows the principle that the producer embeds checkable evidence; the mechanisms differ entirely.

Source passages:
- None

Summary passages:
- None

