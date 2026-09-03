# The Vera review of paper 1

This folder builds the review page of `paper/proveml-spec.tex`: the paper read end to
end, every number bound to the file that produced it, every citation a reading against an
archived copy, the model's proposals on the prose as readings of their own, and a merkle
root over the lot that is signed and anchored. It is the first product use of Vera, built
on 2026-09-02 and 03.

## The chain

```
node tex-adapter.mjs ../proveml-spec.tex report/paper1-blocks.json   # the paper as blocks
node regenerate.mjs                 # rerun the scripts the paper's numbers come from; record what ran
node build.mjs                      # bind, verify, render report/review-page.html and the receipts
node artifact-gate.mjs report/review-page.html          # arm the hand-back for the artifact viewer
node stream-infer.mjs report/review-page-artifact.html  # inject the in-page model pass
```

After a hand-back (the page republishes itself with the judgements) put the judgements in
`report/review.json` and the model pass state in `report/infer-state.json`, then build again:
the proposals become marks, judgements are rekeyed to the block hashes they judged.

Then, going out:

```
node sign-review.mjs        # sign the review root with the did:web key; verify against the DID document
node anchor-hedera.mjs      # Hedera Consensus Service, read back from the mirror node
node anchor-rekor.mjs       # Sigstore Rekor, with the inclusion proof the log returns
node anchor-vana.mjs        # Vana L1 DataRegistry, file record plus proof, read back
node sign-review.mjs --verify && node anchor-*.mjs --verify
```

Every anchor script records only what the log returned, never what was merely submitted.

## Sources on the way in

- `audit-sources.mjs` reads `../../audit`: the archived copies of cited works and the
  related-work claims with their verbatim quotes.
- `provenance.mjs` fetches the live pages over TLS (certificate recorded), asks the Wayback
  Machine for a witness, and timestamps the root with an RFC 3161 authority. Each source is
  labelled with the best rung it earned, never a higher one.
- `pdpp-server.mjs` and `source-pdpp.mjs`: the study's (synthetic) pupil dataset served as a
  PDPP 0.1 source and fetched as a client under a purpose-bound grant, names withheld by the
  field projection. Our own implementation of Core sections 4, 5, 7 and 8, not the lab's.
- `pdpp-review-server.mjs`: the review itself served as a PDPP source, streams `judgements`
  and `signoffs`, so an editor reads the approvals on the reviewer's terms.
- `house-css.mjs` reads the paper tokens, the night set and the five ProveML states out of
  the site's `globals.css` at build time (override with `HOUSE_CSS`); the page says which
  file, by sha256, it was styled from.

## What is here and what is not

`report/` holds the records: the roots, the anchors, the sign-offs, the run records, the
fetched sources and their provenance, the judgements handed back and the model pass state.
The rendered page, the manifests and the inclusion proofs are not committed; the build makes
them again from these. Keys live outside the repository, in `~/.config/proveml/`:
`abovebeyond-signing.jwk`, `hedera-operator.json`, `rekor-key.pem`, `vana-key.json`.

Known not to reproduce byte for byte: `deployment-numbers.mjs` prints timings, and a rerun
differs from the snapshot; the run record says so and the page shows it.

## Dependencies

`proveml` from the repository root (the engine; needs the version with the provenance view,
proveml pull request #19 or later, `npm link ../proveml` until it is published), plus
`@hashgraph/sdk` and `ethers` from this folder's `package.json`. `sign-review.mjs` uses the
credential adapter in the sibling `proveml-demos` checkout (`PROVEML_DEMOS` to point
elsewhere).
