# Minimum fee job: Avalanche and existing UI

Author: A. Shannon

Apply the four groups to minimum-fee-job commit
`de706245e439506ef55697b64caf6605cadf5171` in the listed order.

| Group | Purpose | Prerequisites |
| --- | --- | --- |
| F01 | Backend Docker build and runtime npm version | None |
| F02 | Portable test selection and dependency fixtures | None |
| C-FEE | Avalanche fee calculation, transaction construction and atomic publication | F01, F02 and the reviewed Utils bootstrap |
| C-FEE-UI | Review the atomic publication through the existing page, table and QR | F02, C-FEE |

The table and QR share one publication identity. QR refresh refuses a changed
publication. Legacy mode retains its existing behavior, and the separate
AvalanchePublication prototype is excluded.

With Node 22 and Git available, verify the series in a fresh directory:

```sh
node verify.mjs <parent-containing-minimum-fee-job> <new-scratch-directory>
```

The verifier checks the baseline, patch hashes, inventories and four applied
trees while preserving the source HEAD and index. Scratch must be new and
outside the source repository.

Prepare the fixtures using `docs/avalanche-tests.md`, then run
`npm run test:avalanche`. The complete declared command passed 1,176 tests in
33 spec files through 15 jobs after ordinary clean installation and execution
of the source-owned fixture recipe. This includes the 28 existing UI cases.
`validation.json` pins the qualification receipt and installed lockfiles.

The installed checks corrected the presentation fixtures to use the App's
existing React instance. The separately installed renderer receives that same
instance. The publication suite has an explicit 15-second test deadline for
initial WASM construction and module loading; the job deadline remains bounded.
Package manifests and lockfiles did not change during these corrections.

The full Changesets plan preserves five existing pending notes and adds four
contribution notes. It computes minimum-fee-job 1.4.0 and minfee-app 1.1.0.
`release-preview.json` records that plan; source versions remain unchanged.

Release requires the reviewed Utils successor to be published or selected,
followed by ordinary installation of that release-selected graph. The local
qualification uses a packed reviewed Utils bootstrap. Rosen and operators
provide the production contracts, token mappings, endpoints and economic
authority before deployment and activation. Upstream acceptance remains pending.
