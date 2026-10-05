# Guard shared prerequisites

These eight source groups prepare qualified Ergo submission and signed accounting, token-update lease release, exact balance storage, TSS authorization, Ergo semantics comparison, and atomic transaction/synchronization persistence. They apply to Guard baseline `b1f5ab6f81435053a979e8078eb098d8ec1f5a47` in manifest order.

Use a fresh scratch directory:

```text
node verify.mjs <repository-parent> <fresh-scratch-directory>
```

The repository parent must contain `guard-service` at that exact baseline. The verifier clones it, checks every patch and changed-path inventory, applies each group with its prerequisites, and checks the resulting trees and file hashes. It also checks that the original HEAD and index remain unchanged. Verification needs Git and Node.js.

The final tree is `24ecaa6ff5206ad5d2117033d4614b95f4f6ea5f`. Canonical tests retain baseline scenarios under their actual source class roots; each added scenario keeps its fixture and hook scope. TSS tests retain generated ECDSA and EdDSA class roots. The timestamped migration test filenames mirror their source filenames. Supplemental SQL integration tests remain beside the canonical migration, entity, and registry tests.

The complete Changesets plans are in `release/`. Their input identity proof records the unchanged package metadata and Changesets. The eight-group plan previews Guard `12.0.0`, Ergo `15.1.0`, and Ergo node/explorer networks `10.0.6`; these are release previews. Communication dispatch authorization (`S01`) and SQLite transaction ownership (`U01`) require their producer releases from the adjacent producer series before ordinary dependency qualification.

Source application and focused local tests are contributor preparation. Normal registry installation/build, independent runtime review, CI, and maintainer acceptance remain separate gates. Avalanche transaction safety and its chain-specific signing/runtime wiring belong to the chain integration series.
