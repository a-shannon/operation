# Guard contribution source series

Apply the thirteen dependency-ordered source groups with the unchanged verifier:

```shell
node verify.mjs <repository-parent> <fresh-scratch-directory>
```

The repository parent must contain `guard-service` at the manifest's baseline HEAD. The verifier preserves its checkout and index, creates a fresh checkout, and checks every patch, tree and changed-file hash.

The first eight groups are the frozen shared Guard prerequisites. G01 and G07 supply the generic EVM gas policy and bounded RPC transport. C-GUARD-SOURCE contains Avalanche core behavior, configuration and source-owned tests. G04-CONSUMERS proposes the qualified TSS and Ergo signing consumers through the existing Guard runtime context, including the corresponding caller arguments and runtime capture. C-GUARD-WIRING supplies the remaining Avalanche startup ordering and activation. This ordering is a contributor proposal awaiting Rosen review.

Each proposed C/G04 boundary passes the focused startup-import type check. The final composition additionally has scoped evidence for 529 affected controls and 79 typed inputs; those counts do not describe a full integration suite. Production executable equality covers 59 selected paths against the original algorithms or the separately reviewed route-reader, deployment-backend and health successors. Test titles and source targets were checked against RCS-001 at revision `7b9784dae9d8d5b66b80de7a6043d1ba36a3a4bf`. Supplemental SQL and producer-consumer suites remain explicitly classified for review.

The [focused runtime recipe](../guard-runtime-replay-20261005/README.md) runs six source-owned suites against the applied final tree. It includes the launcher, source/tool pins and the validated 147-case result. These cases overlap the scoped controls above and use the prepared installed graph; they do not establish ordinary registry qualification or full Guard-job coverage.

The full normal Changesets plan is in `release/full-plan.json`. Its combined unreleased source closure plans Guard 12.0.0, Avalanche chain and RPC 0.1.0, Ergo 15.1.0, Ergo node/explorer 10.0.6, EVM 10.1.0 and RPC 4.1.0. Separate release sequencing must be decided before publishing these contributions; releasing a prerequisite first changes the later baseline and requires a fresh plan.

The health wiring requires the scanner successor exporting `AvalancheRpcScanner.withHealthRead`, identified in the manifest. Its bounded deadline-queue and qualified-read independent review closed without findings; the manifest binds its receipt and scope. Final selected-source independent review also passes, receipt SHA `80c8142b60ea01d4fc6428fc31c6f938dc05a3d428389578024d292cc76b5e54`. Ordinary registry installation, lockfile regeneration, full build/CI qualification and Rosen acceptance remain release gates. The source series does not activate a bridge or authorize signing, broadcast or funds operations.
