# Avalanche mainnet contract and token preparation

Compile Rosen's existing Ergo scripts and generate AVAX/JOE configuration for
C-Chain mainnet `43114`. The generator uses `ColdErgoClient`; it has no node
transport, signing key, minting or broadcast operation. Its outputs are
configuration candidates. Activation is a separate operation.

The contract source baseline is
[`4302d8d34020b0012c3fcb25d7484aa602813cab`](https://github.com/rosen-bridge/contract/tree/4302d8d34020b0012c3fcb25d7484aa602813cab).
Apply the contribution's contract patch before running these commands from
the contract repository. Use Java 8 with the existing SBT 1.5.8/Scala 2.12.7
build; the contributor validation used Temurin 8u504 and Ergo AppKit 5.0.0.
The ten `.es` scripts remain unchanged. The portable source contribution is
`operation/contribution/contract-source-series-20261005`, manifest SHA-256
`55436e3be6414d2b6e971c54b4a682933e624f4cc36e243eeb12c9809bf25424`.
From that directory, `node verify.mjs <repository-parent> <fresh-scratch-directory>`
applies the five-path group to a new local clone; the repository parent must
contain `contract` at the pinned baseline. Run the commands below from the
resulting `contract` checkout, tree `b7a81f0408026c99e4a3a520e01c4150ccb56421`.

## Assigned values

Copy `operation/config/avalanche-contract-preparation.template.json` into a
deployment preparation directory and fill each `null`. The reader rejects
unassigned fields, unknown keys and duplicate decoded JSON field names,
including escaped aliases and nested fields.

| Input | Supply at deployment preparation |
| --- | --- |
| `chainId` | `43114`, fixed for this generator |
| `globalTokens` | Existing Rosen `RWTRepoNFT`, `GuardNFT`, `RSN`, `MinFeeNFT`, `EmissionNFT` and `ERSN` identities; reuse the selected deployment's values |
| `chainTokens` | Avalanche `RWTId`, `CleanupNFT`, `AwcNFT` and `RepoConfigNFT` identities supplied by Rosen |
| `custody.lock`, `custody.cold` | Distinct, nonzero C-Chain custody addresses from the approved key ceremony |
| `counterparts.avax`, `counterparts.joe` | Assigned Ergo counterpart token IDs and their decimals; the template proposes nine decimals |
| `cleanupConfirm` | Approved positive Ergo block count for the existing trigger cleanup rule |

Token/NFT IDs must be 64 lowercase hexadecimal characters, nonzero and
distinct across the supplied identities. Custody uses lowercase `0x` addresses.
Counterpart decimals must be between zero and eighteen. Cleanup is measured
by the Ergo script's `HEIGHT`, independently of Avalanche confirmation counts.
The generator prepares configuration after identities are supplied; it does
not perform the minting needed to obtain them.

AVAX uses source ID `avax`, eighteen decimals and type `native`. JOE uses
`0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd`, eighteen decimals and
type `ERC-20`. [LFJ's JOE documentation](https://docs.lfj.gg/additional-information/brand-and-ecosystem-information/joe_token_emissions_6793324)
identifies its governance token and Avalanche address. Each source asset has
an Ergo `EIP-004` counterpart with `wrapped` residency.

## Offline rehearsal

The contract repository includes
`src/test/resources/avalanche/assigned-values.example.json`. Every custody and
Ergo token identity in that example is synthetic; `21600` is a test cleanup
parameter. Mainnet serialization and contract address encoding are exercised
without accessing mainnet.

Run only the focused offline suites. The repository's older general contract
tests use their own configured node/deployment paths.

```sh
sbt -Dsbt.offline=true 'set offline := true' 'set Test / parallelExecution := false' 'testOnly contracts.AvalanchePreparationSpec contracts.AvalancheOverlayMergeSpec'
sbt -Dsbt.offline=true 'set offline := true' 'runMain rosen.bridge.AvalanchePreparation --input src/test/resources/avalanche/assigned-values.example.json --output ./rehearsal-overlay'
```

Offline mode requires the previously cached dependency graph. The exact
exported checkout passes 62/62 focused tests in two suites. Serialize the suites
because they share compiler state: the preserved concurrent run passed 61/62
and raised `_sourceContext can be set only once`. The serialized rerun changes
only SBT session settings. Twenty baseline inputs retain their text after
CRLF-to-LF normalization; no build-file or Ergo script semantic change is
needed. This result does not qualify a fresh dependency resolution.

The output directory must be absent and its parent must exist. The generator
writes `contracts-overlay.json`, `tokens-overlay.json` and a manifest with the
input digest, script source digests and output sizes/digests. It compiles the
Ergo lock as well as the nine Avalanche-associated Ergo contracts, while the
Avalanche lock/cold fields retain the supplied EVM custody addresses.

## Add the chain to the existing deployment configuration

Use the full selected deployment's `contracts.json` and `tokens.json` as bases.
The merge command recompiles from the assigned values; it does not trust a
manually edited overlay.

```sh
sbt -Dsbt.offline=true 'set offline := true' 'runMain rosen.bridge.AvalancheOverlayMerge --input ./assigned-values.json --contracts-base ./existing-contracts.json --tokens-base ./existing-tokens.json --output ./avalanche-deployment-candidate'
```

The merge preserves other chains, existing asset definitions and both base
version fields. The supplied global token configuration must match the base
deployment exactly. It refuses an existing Avalanche registration and new
asset identifiers that collide with an existing definition, including EVM
address case aliases. Update an already registered Avalanche deployment through
its own reviewed migration procedure.

The new directory contains complete merged `contracts.json` and `tokens.json`,
plus a manifest recording the three input digests, compilation source digests,
generator/runtime versions and output digests. The command rechecks input and
source bytes before writing. Neither base file is modified.

## Deployment acceptance

Before activation, verify that the assigned IDs belong to the intended Rosen
deployment, custody matches the approved key ceremony and generated addresses
match an independent compilation of the pinned scripts. Load the complete
merged token map through the released Guard and UI packages; official type
labels must survive unchanged. Confirm the AVAX and JOE source/counterpart
conversions using the actual assigned decimals.

Keep service activation disabled while qualifying the exact RPC endpoints,
confirmation/fee policy, start height and database migrations. Rehearse an AVAX
and JOE lock and return payment on the local mainnet profile, including refusal
of failed, missing or conflicting token Transfer evidence. Rosen then performs
the approved minting/deployment and key-ceremony operations, and operators
activate only the independently checked release and configuration.

Additional standard ERC20 assets use the same direct transfer and custody
route. Each needs its verified source contract/decimals, assigned Ergo
counterpart and token-map entry. Asset qualification must establish exact
transfer amounts; fee-on-transfer and rebasing behavior require a separate
supported policy before inclusion.
