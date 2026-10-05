# Avalanche producer contribution series

These eight patches separate shared prerequisites from Avalanche additions.
Submit each shared group as its own contribution. Keep the Avalanche changes
in C-UTILS and C-SCANNER after their prerequisites. The integration document
still awaits Rosen review; this series prepares the source and release work.

| Group | Repository | Purpose | Required earlier groups |
| --- | --- | --- | --- |
| S01 | sign-protocols | Final communication dispatch authorization | — |
| S02 | sign-protocols | Ergo multisignature authorization | S01 |
| U01 | utils | SQLite transaction ownership | — |
| C-UTILS | utils | Avalanche address and extractor registration | — |
| SC01 | scanner | Optional cleanup configuration | — |
| SC02 | scanner | Exact raw-data replay and pure EVM derivation | U01 |
| SC03 | scanner | Bounded EVM RPC timeout | — |
| C-SCANNER | scanner | Finalized Avalanche scanning and AVAX/ERC20 observations | U01, C-UTILS, SC01, SC02, SC03 |

`manifest.json` pins the repository baselines, each patch and every changed or
deleted path. To reproduce the exact application, arrange the three repository
checkouts under one parent and run:

```text
node verify.mjs <repository-parent> <fresh-scratch-directory>
```

The verifier creates separate scratch checkouts, checks the ordered trees and
file hashes, and confirms that the original checkouts' HEAD and index remain
unchanged. It preserves its checkouts and receipt for inspection. Use Node
22.18.0 or newer and Git. Runtime and registry installation checks are separate.
The exported verifier passes all eight applications and refuses an original
repository as scratch, a wrong baseline and a corrupt patch before writing.

The generic replay tests pass 41 cases; adding Avalanche passes 43. Both stages
pass the extractor and raw-provider TypeScript builds. Independent review
checks the chain/shared separation, the deleted test and the chain-specific
raw-provider changeset. `validation.json` pins those receipts and their scopes.

`release-previews.json` contains the actual Changesets status/version outputs
at these baselines, including their existing pending notes. If the scanner
groups are released together, the new EVM
extractor is 7.1.0. If the shared groups are released first, the extractor is
7.1.0 in that release and 7.2.0 when Avalanche is released. The final raw
provider is 0.3.0 in either preview; Changesets sets its extractor range to
`^7.2.0` in the second scenario. The two package-manifest dependency additions
must be rebased on the intervening release metadata. Runtime patch files stay
identical. These numbers are previews, subject to the actual release baseline.

Do not manually bump versions in contribution patches. Recompute the normal
Changesets plan after each accepted prerequisite or intervening release. Use
the complete plan without a `--since` note filter, the existing repository
formatter and release scripts. Verify the published
producer package's exact version, integrity and required exports before
opening a dependent consumer contribution. Then regenerate the ordinary npm
lockfile and run its normal clean install/build and affected tests. Local
compiled dependencies used by the recorded tests do not close that gate.

The complete integration notes and operational acceptance steps are in
`../../docs/avalanche-rcs-integration.md` and `../../docs/avalanche-c-chain.md`.
