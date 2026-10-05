# Avalanche gas, RPC, health and contract contribution series

These four patches keep generic prerequisites separate from Avalanche additions.
Each patch has its own inventory and pinned repository baseline.

| Group | Repository | Purpose | Release order |
| --- | --- | --- | --- |
| G01 | guard-service | Generic EVM gas-policy hooks | Before the Avalanche chain package |
| G07 | guard-service | Generic RPC reads and transport behavior | Before the Avalanche RPC package |
| C-HEALTH | health-check | Finalized AVAX and mapped ERC20 balance checks | After the test RPC dependency is available |
| C-CONTRACT | contract | Assigned-value preparation and preservation of existing configuration | Before actual assigned contracts and tokens are merged |

Arrange these repository checkouts under one directory, at the revisions in
`manifest.json`, then run:

```text
node verify.mjs <repository-parent> <fresh-scratch-directory>
```

Use Node 22.18.0 or newer and Git. The verifier makes separate scratch checkouts,
checks all four ordered trees and 22 changed paths, and preserves a receipt.
It does not stage or modify the original checkouts. G07 follows G01 in this
application sequence; its API changes can be reviewed independently.

Fresh independent checks pass 69 gas-policy, 38 RPC and 56 health cases, with
scoped TypeScript, lint and formatting. The four contract source/test files
match the independently reviewed preparation and merger. `validation.json`
records the exact evidence and its scope. These tests use local installed
dependencies; normal registry installation remains a separate gate.

`release-previews.json` contains complete Changesets plans, including existing
pending notes. At these baselines G01 derives `@rosen-chains/evm` 10.1.0 and G07
derives `@rosen-chains/evm-rpc` 4.1.0. The Avalanche consumers must require at
least the versions containing those APIs. The prepared floors are `^10.1.0`
and `^4.1.0`; the numbers must be recalculated against the accepted release
baseline. New packages retain their initial version and initialization note
until the normal release process computes their version.

The health tests consume the Avalanche RPC provider. Its publication is a test
dependency, even though production health accepts the existing structural
provider port. Release generic G01/G07 first, then the Avalanche provider, then
health and the affected services. The full service release graph is still
being composed. After actual package publication, verify integrity and exports,
regenerate ordinary lockfiles and run the normal install/build and affected tests.

The contract patch prepares assigned values and merges them into an existing
deployment without replacing other networks or global identities. Rosen still
assigns, mints and deploys final contracts/tokens and performs the key ceremony.
The integration review and operational procedure are in
`../../docs/avalanche-rcs-integration.md` and `../../docs/avalanche-c-chain.md`.
