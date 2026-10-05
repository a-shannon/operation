# Watcher: Avalanche and prerequisite contributions

Author: A. Shannon

Apply these patches to Watcher commit
`4552b29b95dd48947f85406857641b1ecb2e5490` in the listed order. Each generic
change is a separate contribution; C-WATCHER contains the Avalanche wiring.

| Group | Purpose | Required predecessor |
| --- | --- | --- |
| W03 | Node22 compatibility and RCS Vitest runner alongside existing Mocha tests | None |
| W01 | Optional Ergo signing action after context acquisition | W03 |
| W02 | Await persistence on both failed queue paths | W03 |
| C-WATCHER | Mainnet AVAX/mapped ERC20 scanner, health and persisted observation leases | W03, W01, W02 and released external producers |

The final test runners use one worker. The declared command passes185 legacy,
five shared and116 Avalanche cases before the literal-target correction.
That correction separately passes the same116 cases with identical titles,
registration order and callback bodies, including empty-string negatives.
The exact evidence scope and hashes are in validation.json.

The complete Changesets preview computes `@rosen-bridge/watcher`7.0.0 from
the pinned6.3.2 baseline, preserving all seven pre-existing pending changesets
(six affect the version; one is empty) and the four contribution notes.
`release-preview.json` records the complete
plan and the version output. The exact four-patch application is recorded in
`verification.json`.

With Node22 and Git available, verify all four exact trees without changing
the source checkout:

```sh
node verify.mjs <parent-containing-watcher> <new-scratch-directory>
```

The verifier checks baseline, patch bytes, complete file inventories and result
trees before recording verification.json in scratch. It preserves the source
HEAD and index. Scratch must be fresh and outside the source repository.

C-WATCHER requires the producer sequence's address-codec2.2, EVM observation
extractor7.2, EVM scanner2.1, abstract scanner4.0.1 and transaction-owned
extended-typeorm1.1.1. These are prepared minimum floors. Verify the actual
approved registry releases and package exports, regenerate the ordinary
lockfile, then run the normal clean install, type checks and npm test.
The patches preserve the upstream lockfile until those releases exist.

The generated merged contract/token fixtures retain their exact hash-bound
merger bytes. They are excluded from formatting; other changed test and
runner sources follow the repository formatter. Actual Watcher process replay
is supplied separately in watcher-mainnet-replay-20261005.
