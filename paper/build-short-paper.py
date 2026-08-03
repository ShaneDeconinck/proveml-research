#!/usr/bin/env python3
"""Assemble the short arXiv paper from the verified long version.

Every table, figure, measured number and limitation is lifted VERBATIM from
proveml-technical-report.tex (the quadruple-verified long version). Only the
connective prose is new, and it makes no quantitative claim that a reused block
does not already carry.
"""

src = open('proveml-technical-report.tex').read()

def block(marker, env='table'):
    i = src.index(marker)
    start = src.rindex('\\begin{%s}' % env, 0, i)
    end = src.index('\\end{%s}' % env, i) + len('\\end{%s}' % env)
    return src[start:end]

head            = src[:src.index('\\noindent\\textbf{Keywords:}')]
# the source file is the technical report; the short paper drops that subtitle
head            = head.replace('\\\\[0.3em]\\large Technical Report', '')
keywords        = src[src.index('\\noindent\\textbf{Keywords:}'):src.index('\\section{Introduction}')]
fig_comparison  = block('label{fig:comparison}', 'figure')
fig_errors      = block('label{fig:render-errors}', 'figure')
fig_audit       = block('label{fig:render-audit}', 'figure')
fig_symgen      = block('label{fig:symgen-vs-proveml}', 'figure')
tab_operators   = block('label{tab:operators}')
tab_capability  = block('label{tab:capability}')
tab_coverage    = block('label{tab:coverage}')
tab_symgen      = block('label{tab:symgen}')
tab_related     = block('Comparison across representative verification approaches')
deployment      = src[src.index('\\section{Deployment}'):src.index('\\section{Related Work}')].rstrip()
limitations     = src[src.index('\\begin{itemize}[nosep]\n    \\item \\textbf{Consistency, not truth.}'):]
limitations     = limitations[:limitations.index('\\end{itemize}')+len('\\end{itemize}')]
i               = src.index('\\section{Error Detection Rate}')
detection       = src[i:src.index('\\section{ProveML Grammar (EBNF)}', i)].rstrip()
grammar         = src[src.index('\\section{ProveML Grammar (EBNF)}'):src.index('\\end{document}')].rstrip()
opening         = src[src.index('Large Language Models (LLMs) produce fluent'):src.index('In one line:')].rstrip()
intro_ixbrl     = src[src.index('In one line: \\textbf{ProveML is iXBRL'):src.index('\\begin{figure}', src.index('In one line:'))].rstrip()
intro_limits    = src[src.index('Two limits belong here rather than at the end'):src.index('Recent theoretical work')].rstrip()
conclusion      = src[src.index('\\section{Conclusion}'):src.index('\\section*{Declaration')].rstrip()
declaration     = src[src.index('\\section*{Declaration'):src.index('\\bibliographystyle')].rstrip()
syntax_example  = block('(* Simple form: entity, then facts follow *)', 'lstlisting')
store_example   = block('account:901.holder', 'lstlisting')
threshold_defs  = block('IS_LOW:        score lt 25', 'lstlisting')
compose_example = block('?[risk: @low AND @missing]', 'lstlisting')

# reused blocks reference sections the short paper does not carry;
# retarget them to their nearest equivalent here
fig_errors  = fig_errors.replace('Section~\\ref{sec:rendering} covers the rendering states;', 'The technical report covers the full set of rendering states;')
deployment  = deployment.replace('(Section~\\ref{sec:algorithm})', '(Section~\\ref{sec:proveml})')
deployment  = deployment.replace('(Section~\\ref{sec:education})', '(Section~\\ref{sec:evaluation})')
limitations = limitations.replace('Section~\\ref{sec:coverage} quantifies', 'Section~\\ref{sec:evaluation} quantifies')

# the audit caption referenced a figure the short paper does not carry
fig_audit = fig_audit.replace(
    'Audit mode on the same text as Figure~\\ref{fig:render-verify}: the exact fact store path checked for each claim is visible inline',
    'Audit mode: the exact fact store path checked for each claim is visible inline')

# detection study becomes an appendix section; its cross-reference must survive
detection = detection.replace('(Section~\\ref{sec:education})', '(Section~\\ref{sec:evaluation})')

body = r"""
\section{Introduction}

""" + opening + "\n\n" + intro_ixbrl + "\n\n" + fig_errors + "\n\n" + intro_limits + r"""

Hallucination is structural, not incidental: calibrated language models must hallucinate at a rate approaching the fraction of facts appearing exactly once in training \citep{kalai2024}, and standard training pipelines reward guessing over acknowledging uncertainty \citep{kalai2025}. Regulation adds urgency --- the EU AI Act's transparency duties apply from August 2026 \citep{euaiact} --- and the leading legal research tools still hallucinate between 17\% and 33\% of the time despite vendor claims of near-elimination \citep{magesh2025}. The response this paper takes is not to make the model more truthful but to make its claims \textit{checkable}: every marked claim either matches an addressable record or is flagged, deterministically, before anyone reads it.

This paper is deliberately compact: it gives the idea, the three constructs, what the mechanism costs, and what we measured. The complete specification --- verification algorithm, three-valued condition semantics, rendering states, canonicalization rules --- and the full evaluation with all ablations are in the accompanying technical report, published in the artifact repository alongside every benchmark, run artifact, and the scripts that regenerate every table in both documents.\footnote{\url{https://github.com/ShaneDeconinck/proveml-research} --- reference implementation: \url{https://github.com/ShaneDeconinck/proveml} (npm: \texttt{proveml}).}

\section{ProveML}
\label{sec:proveml}

ProveML extends Markdown with three constructs, using characters (\texttt{@}, \texttt{\%}, \texttt{?}) that do not conflict with standard Markdown syntax. LLMs produce Markdown fluently, and existing renderers pass the constructs through unchanged.

""" + syntax_example + r"""

\paragraph{Entity references} \texttt{@[type:id]\{name\}} declare the subject. The verifier checks the display name against the store (\texttt{sensor:42.name}), and the entity becomes the context for the facts that follow. Binding is structural, never controlled by the LLM: a fact inside scoped braces binds to that entity (lexical scope); a fact outside binds to the last simple-form entity at the current depth (linear carry-forward), and closing a scope restores the context that was in force when it opened.

\paragraph{Fact references} \texttt{\%[field]\{value\}} claim a value. The verifier checks $\texttt{store}[\textit{entity}.\textit{field}] = \textit{value}$ by exact string equality on the store's canonical representation. Four outcomes: \textit{verified}, \textit{mismatch}, \textit{unverifiable} (no such field), \textit{no context}.

\paragraph{Inference references} \texttt{?[label: CONDITION]\{text\}} make a qualitative judgment checkable. The condition names a threshold from a registry defined outside generation; the model cannot invent a comparison value, a bound, or a direction, and an unregistered name is an error rather than a claim. Conditions compose with \texttt{AND}, \texttt{OR}, \texttt{NOT} and can reference earlier labels:

""" + compose_example + r"""

\paragraph{The fact store} is a flat key-value index in the Entity-Attribute-Value pattern; any source with records and fields flattens into it as \texttt{type:id.field $\rightarrow$ value}, with optional companion keys for units and nested sub-paths for hierarchical data:

""" + store_example + r"""

\noindent The store is the single point of trust and the canonicalization point: the guarantee is ``consistent with the fact store'', not ``true'', and verification is always relative to an immutable store state (deployments can bind a snapshot identifier to each result). Arithmetic lives in the data layer, not the verifier: a cross-entity difference is materialized as an addressable fact (\texttt{region:EU.\_salesDiff}) and bounded by a registered predicate, so every operand of every comparison is itself auditable.

\paragraph{The threshold registry} draws on clinical reference ranges, JSON Schema validation and monitoring alert rules: domain experts think in named ranges with semantic labels, not operator expressions. Each definition has a name, a field, one predicate from a deliberately small vocabulary (Table~\ref{tab:operators}), an optional unit constraint, a label and a source for audit:

""" + threshold_defs + "\n\n" + tab_operators + r"""

\paragraph{Verification} resolves each construct against the store --- string equality for entities and facts, typed comparison for thresholds --- with no model in the loop, so it is exact, explainable and effectively free (Section~\ref{sec:deployment}). Connectives use three-valued semantics: an unresolvable condition is \textsc{Unknown}, not false, so \texttt{NOT UNREGISTERED} cannot verify. Because errors come back as specific messages (``\texttt{student:42.passRate}: claimed 7, actual 5''), verification can sit inside a generation loop that feeds each error back to the model; and because the verifier only reads the text, it can equally audit text it did not generate. Figure~\ref{fig:comparison} shows the pipeline; Figure~\ref{fig:render-audit} the audit rendering, where each claim carries its proof path.

""" + fig_comparison + "\n\n" + fig_audit + r"""

\section{What We Measured}
\label{sec:evaluation}

\paragraph{Setup.} Four models (Phi-3 Mini 3.8B, Qwen 2.5 3B and 7B via Ollama in default quantization and decoding, Claude Haiku via API), two benchmarks --- 28 Dutch-language prompts over a generated educational dataset of 741 pupils in 95 classes,\footnote{Generated, not de-identified: every record is drawn from a latent-ability model, the school is fictional, and the seeded generator ships with the artifacts. We state this from experience: an earlier draft used a de-identified extract of real records under the label ``synthetic''; it was withdrawn, replaced, and every educational result re-measured on the replacement.} and 10 English prompts over real SEC EDGAR FY2025 filings (2 entities, 11 fields) --- 3 runs each, up to 3 correction loops. Verification rate is a per-query macro-average; a response with no markup scores 0\%, an empty answer scores 0\% rather than being dropped, and only calls killed at the wall clock leave the denominator (one call in all runs). Context is sliced per prompt from the benchmark's own entity lists --- an oracle retriever, which makes the rates below an upper bound conditional on retrieval. The system prompt asks for entity and fact markup; no run produced an inference construct, so all rates measure those two. Full protocol, per-run artifacts and two further ablations are in the technical report; every number below regenerates from the published runs.

\paragraph{Finding 1: the shape of the request decides, not the size of the model.} Three models cluster at 88--89\% first-pass verification and are not separable at three runs (per-run values 88/88/90, 85/88/90, 83/91/92); the smallest is unstable in a way a mean cannot describe --- 38\% $\pm$ 33.7 hides runs of 65\%, 48\% and 0\%. On the compact finance benchmark the same model scores 92\% $\pm$ 2.5 with all runs within 5 points, architecture, verifier and grammar unchanged. Two ablations locate the factors: translating the educational prompts to English moves Phi-3 roughly 22 points and, more to the point, removes the mode in which it produces nothing (English runs: 70/58/53), while moving the larger three by at most 2; and giving any local model the full dataset instead of a slice drives markup production to zero on all 28 queries --- not to silence but to unverifiable prose, 62 to 205 numeric tokens with no markup at all. Residual failures are dominated by addressability errors (wrong entity or field path, 75--82\% of the residue) rather than wrong values.

""" + tab_capability + r"""

\paragraph{Finding 2: verification rate alone overstates what has been checked.} We audit \textit{coverage}: the fraction of standalone numeric tokens that appear inside markup at all (Table~\ref{tab:coverage}). The three stable models are indistinguishable on rate and more than 30 points apart on coverage --- Haiku marks 91.9\% of its numeric tokens, Qwen 7B 60.5\% at the same verification rate, leaving nearly two fifths of its numbers as unverifiable prose. The two metrics must be read together; either alone can be gamed by saying less or marking less.

""" + tab_coverage + r"""

\paragraph{Finding 3: substitution and verification fail differently.} SymGen \citep{symgen}, the closest published mechanism, takes the opposite strategy: the model emits Jinja-like references into the data and a parser substitutes them, so a wrong number is impossible --- and so is reporting one. We reimplemented its Direct strategy on identical models, prompts, slices and data (Figure~\ref{fig:symgen-vs-proveml}, Table~\ref{tab:symgen}). On education it binds slightly more of the numeric output than ProveML, but 306 of its 1{,}392 references (22\%) address paths that do not exist and render as the literal string \texttt{undefined}, touching 41\% of responses. ProveML fails on addressability too (155 of 1{,}528 first-pass claims, 10\%), but its failure is a flagged claim carrying the expected value rather than a hole in the sentence: it flagged 212 claims on the first pass, 40 of them wrong values --- a class substitution cannot produce and equally cannot report. One asymmetry remains: ProveML's delivered responses passed through up to three correction loops while SymGen generated in one pass; the flagged-claim counts are first-pass and unaffected.

""" + fig_symgen + "\n\n" + tab_symgen + "\n\n" + deployment + r"""

\section{Related Work}
\label{sec:related}

The idea of tagging human-readable text for machine resolution is old: RDFa binds spans of prose to entities in a structured vocabulary and assumes the author meant it \citep{rdfa}; iXBRL embeds machine-readable tags in financial reports for automated audit \citep{ixbrl}. ProveML adds the verdict to that lineage --- not what a span refers to, but whether the claim survives comparison with the record. Among recent systems, Proof-Carrying Numbers \citep{pcn2025} is the nearest neighbour (claim-bound numeric tokens, deterministically verified in the renderer, with declared tolerance policies; its published description does not cover entity scoping or a named vocabulary for qualitative judgments), and SymGen \citep{symgen} is the baseline of Section~\ref{sec:evaluation}. Fact verification against evidence has a canonical benchmark lineage --- FEVER \citep{fever}, TabFact \citep{tabfact}, FEVEROUS \citep{feverous} --- in which a trained model judges support; ProveML sits outside it by making the judgment a lookup. Probabilistic faithfulness checkers, academic (SummaC, \citealp{summac}; AlignScore, \citealp{alignscore}; MiniCheck, \citealp{minicheck}) and industrial (Bedrock, Azure Groundedness, Vectara HHEM), score responses after generation; schema validators (Instructor, Outlines) constrain form, not values. To our knowledge, no existing framework combines inline claim markup, deterministic mismatch detection against structured data, and composable threshold inference in a single system.\footnote{We screened the titles and abstracts of the 4{,}617 papers in the ACL 2026 main, short, findings and industry volumes against concept patterns for claim-level attribution, structured-data faithfulness, symbolic or deterministic verification, provenance and markup schemes, then read the resulting candidates by hand. The sweep was not preserved as a runnable artifact, so this is the result of a search rather than an exhaustive negative.} Table~\ref{tab:related} places the neighbours; the technical report discusses each in full.

""" + tab_related.replace('\\end{table}', '\\label{tab:related}\n\\end{table}') + r"""

\section{Discussion and Limitations}
\label{sec:limitations}

The deeper value is not the correction loop but the boundary itself. With ProveML markup, every marked claim carries a verification status and an addressable path, so a reader --- or an auditor months later --- can ask of any number where it came from and get an answer that does not depend on a model. What changes is the unit of accountability: from ``was this report right'' to ``was this claim right, and against which record''. Because entity references are structural and display text is separate from the identifier the verifier resolves, a deployment can hand the model pseudonymous identifiers and substitute names at display time --- a property the syntax makes available, not one we evaluated.

""" + limitations + r"""

\noindent Future work follows from the limits: tolerance-based matching for rounded prose, derived-value claims, standardized unit vocabularies, an abstention metric for unsupported queries, and constraining decoding to well-formed ProveML with only existing paths --- grammar-constrained generation (PICARD, \citealp{picard}; Synchromesh, \citealp{synchromesh}) makes that an application of known technique rather than a research program, and it would remove much of what we measure as addressability error.

""" + conclusion + "\n\n" + declaration + r"""

\bibliographystyle{plainnat}
\bibliography{proveml}

\appendix

""" + detection + "\n\n" + grammar + "\n\n\\end{document}\n"

open('proveml-spec.tex', 'w').write(head + keywords + body)
print('geschreven:', len((head + keywords + body).split()), 'woorden totaal')
