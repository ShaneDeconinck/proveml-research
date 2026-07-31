# Citation characterization audit (exploratory, not used in the paper)

A side experiment: do published papers characterize the work they cite accurately?
Three arXiv papers were read, their characterizations of cited work extracted, and
three candidates flagged where the description looked like it might drift from the
source (`extracted-claims.json`).

Nothing here feeds the ProveML paper, and none of the flagged candidates was
followed through to a verdict. It is kept because the question is worth returning
to: the bibliography verifier in `audit/scripts/` checks that citation *metadata*
is right, and this asks the harder question of whether the *sentence* is.

The `.html` files are archived copies of the three papers' pages, kept only as the
evidence those extractions were made from.
