# Avalanche C-Chain integration

The current contribution targets AVAX and standard mapped ERC20 on C-Chain
mainnet (`43114`), with JOE as the first token. Native validation is retained;
the documented local token-consumer, persistence, configured Guard and browser
joins pass at their stated source and fixture boundaries. Published dependency
qualification, the dashboard token-link input and operating activation remain
separate gates.
Keep guard `avalanche.enabled` set to `false` until Rosen approves a
compatible release, contract set and activation policy. The existing Compose
files select published images; changing a YAML setting does not add the local
Avalanche implementation to those images.

The [integration review](avalanche-rcs-integration.md) maps the requirements,
source revisions, reproducible examples and outstanding activation inputs.
The release sequence below prepares producer packages before their consumers.
The portable export's own manifest identifies its exact source inventory and
replay results; local preparation does not establish maintainer acceptance.
Use the [source handoff](../contribution/avalanche-contributor-handoff-20261005/README.md)
to select the exact final repositories. Its independent application commands
avoid duplicating shared prerequisites or replacing current contract sources
with historical outputs.

The chain name is `avalanche`; its native asset identifier is `avax`. Mainnet
is the primary deployment profile. Select `43114` explicitly and use the same
network throughout the watcher, guard, token mapping and fee service. No
production destination byte has been assigned by this integration.
Fuji (`43113`) is an optional profile of the same implementation.

[Contract preparation](avalanche-contract-preparation.md) provides an offline
generator, assigned-values template, synthetic input and configuration merge.
It reuses the existing Rosen scripts. Final minting, custody keys and deployment
remain Rosen operations.

## Watcher configuration

The watcher selects Avalanche with `network: avalanche`. Its Avalanche reader
requires the following settings in the watcher's `config/local.yaml` override:

| Setting                            | Meaning and accepted values                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `avalanche.type`                   | `rpc`                                                                                                          |
| `avalanche.chainId`                | Numeric `43113` or `43114`                                                                                     |
| `avalanche.sourceId`               | Stable provider identity: 1–128 letters, digits, dots, underscores or hyphens, starting with a letter or digit |
| `avalanche.rpc.url`                | Operator-selected HTTP(S) C-Chain endpoint                                                                     |
| `avalanche.rpc.timeout`            | Positive request timeout in seconds                                                                            |
| `avalanche.rpc.authToken`          | Optional authentication token                                                                                  |
| `avalanche.initial.height`         | Last height preceding the first block to scan; integer at least `-1`                                           |
| `avalanche.interval`               | Positive scan interval in seconds                                                                              |
| `avalanche.healthCheck.blockTime`  | Positive operational estimate in seconds for health checks                                                     |
| `observation.confirmation`         | Required observation confirmation count, subject to finalized execution                                        |
| `observation.validThresholdBlocks` | Positive block count limiting observation processing age                                                       |

For a fresh database, `initial.height: -1` starts at block zero. Choose the
reviewed contract activation boundary deliberately; copying another chain's
initial height can omit relevant deposits. Avalanche uses the explicit block
age threshold above instead of converting `observation.validThreshold` seconds.

The usual watcher Ergo wallet, contracts, tokens and database configuration is
also required. A C-Chain endpoint alone is insufficient to initialize a watcher.
See the [watcher configuration reference](watcher/env-references.md) for the
existing common settings.

## Guard configuration

The default is disabled:

```yaml
avalanche:
  enabled: false
```

An enabled guard requires explicit values for every field below. These names
differ from the watcher configuration, particularly the initial height and scan
interval. The guard uses RPC without an additional network selector.

| Setting                                                                                                                                                                    | Meaning and accepted values                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `avalanche.chainId`, `avalanche.sourceId`, `avalanche.rpc.url`                                                                                                             | Same identity rules as the watcher                                                        |
| `avalanche.rpc.authToken`                                                                                                                                                  | Optional authentication token; Guard Docker maps `AVALANCHE_RPC_AUTH_TOKEN` to this field |
| `avalanche.rpc.timeout`, `avalanche.rpc.scannerInterval`                                                                                                                   | Positive seconds representable as whole milliseconds within the runtime timer range       |
| `avalanche.rpc.initialHeight`                                                                                                                                              | Last height preceding the first block to scan; integer at least `-1`                      |
| `avalanche.healthCheck.blockTime`                                                                                                                                          | Positive operational block-time estimate in seconds                                       |
| `avalanche.maxParallelTx`                                                                                                                                                  | Positive integer                                                                          |
| `avalanche.routes.cold`, `avalanche.routes.manual`, `avalanche.routes.arbitrary`                                                                                           | Explicit booleans; omitted routes are disabled                                            |
| `avalanche.gasPriceSlippage`, `avalanche.gasLimitSlippage`                                                                                                                 | Nonnegative integer policy values using the shared EVM verification rules                 |
| `avalanche.gasLimitMultiplier`                                                                                                                                             | Integer multiplier at least `1`                                                           |
| `avalanche.gasLimitCap`                                                                                                                                                    | Positive uint256 estimate limit, expressed as a decimal string or safe integer            |
| `avalanche.confirmation.observation`, `avalanche.confirmation.payment`, `avalanche.confirmation.cold`, `avalanche.confirmation.manual`, `avalanche.confirmation.arbitrary` | Required positive safe integer block counts, including disabled management routes         |
| `avalanche.tssChainCode`                                                                                                                                                   | Nonempty chain-code text for the ECDSA backend                                            |
| `avalanche.derivationPath`                                                                                                                                                 | 1–255 non-hardened integer indices, each from `0` through `2^31 - 1`                      |

`gasLimitCap` bounds the estimate before applying `gasLimitMultiplier`; it is
not a cap on the multiplied transaction gas limit. Their product must fit uint256.
Native envelopes require positive gas and an empty access list. The builder
checks the final value plus maximum fee against the actual balance in wei;
rounding the available balance to wrapped token units cannot cover a missing wei.
Gas policy still needs to be selected and exercised with the intended contracts.

Enabled guards also require:

| Setting                                                                                          | Meaning and accepted values                                                                  |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `avalanche.healthCheck.nativeWarnWei`, `avalanche.healthCheck.nativeCriticalWei`                 | Canonical unsigned decimal strings in wei, at most uint256; critical must not exceed warning |
| `avalanche.healthCheck.tokens[].tokenId`, `.warnRaw`, `.criticalRaw` | One unique lowercase nonzero contract address per admitted ERC20; canonical uint256 raw decimal strings with critical at most warning |
| `avalanche.healthCheck.scannerWarnAgeSeconds`, `avalanche.healthCheck.scannerCriticalAgeSeconds` | Positive integer seconds; warning must not exceed critical                                   |
| `balanceHandler.avalanche.updateInterval`, `balanceHandler.avalanche.updateBatchInterval`        | Positive seconds representable as whole milliseconds within the runtime timer range          |
| `balanceHandler.avalanche.tokensPerIteration.rpc`                                                | Positive integer batch size                                                                  |
| `reward.bridgeFee.avalanche`                                                                     | Explicit list of Ergo addresses and nonnegative integer percentages whose total is below 100 |

RCS-003 recommends a token batch size of `9999` unless the endpoint imposes a
limit. AVAX and each admitted ERC20 require an explicit positive
`balanceHandler.avalanche.tokensPerIteration.rpc`; choose it with the endpoint's
documented limits. Synthetic fixture batch sizes do not assign production policy.

Use [the disabled health template](../config/avalanche-health.template.json)
for the mainnet AVAX/JOE profile. Replace every null with an approved threshold
before enabling Avalanche, and supply the other required configuration above.
Native thresholds are wei; token thresholds are raw contract units. JOE has
18 decimals, so one JOE is `1000000000000000000` raw units. These are distinct
from the token map's shared units used by orders and accounting.
Every admitted token needs exactly one matching health entry; missing,
duplicate, unmapped or conflicting entries refuse startup. If another standard
ERC20 is admitted, add its map and health entry together. AVAX health remains
required to cover gas. Balances are read at the qualified finalized block under
the scanner's persisted safety exclusion; a hold refuses the read.

The contract file's `avalanche` entry must supply nonzero C-Chain
`addresses.lock` and `addresses.cold`, valid Ergo `addresses.WatcherPermit`, `addresses.Fraud`,
`addresses.WatcherTriggerEvent` and `addresses.Commitment`, and a nonzero
32-byte `tokens.RWTId`. Use contracts and token mappings from the same approved
release. The configuration class exposes lock, cold, permit and fraud addresses
and all five confirmation counts as immutable data. Supplying these required
values does not enable cold-storage, manual or arbitrary Avalanche operations.
Each requires its corresponding `avalanche.routes` flag. Manual transactions
also require the existing global manual-request switch; arbitrary orders require
the existing global arbitrary-order switch. These flags remain disabled in the
default configuration.

Cold transfers require `thresholdsPath` to supply the native `avax` reserve
and thresholds for each selected cold ERC20, with `0 <= low < high`. The existing
threshold reader converts source amounts through the token map. Token cold
selection precedes excess AVAX and queues one asset per active chain row.
New transfers require balance above `high`, no forbidden selected asset or
conflicting active cold transaction, and sufficient AVAX for the actual gas
estimate times the configured multiplier and maximum fee. Native available
balances round down to shared units; gas budgets round up, preserving the low
reserve including any raw remainder. Manual transfers carry empty route data; arbitrary transfers
carry their exact lowercase 32-byte order ID and retain the matching database
order. Every route retains the admitted quorum and lock signing identity.

The Guard rechecks route policy, row identity, fee/reserve and scanner safety
before signing and new submissions. Management submission uses the qualified
transport and cannot fall back to legacy submission. Reconciliation, completion
and invalidation use settled execution evidence and preserve their exact SQL
preimages; a consumed cold balance does not prevent reconciliation of an already
successful transfer. Restarting a row does not create a fresh authorization.

The token map must contain exactly one native AVAX set: its Avalanche member
uses `tokenId: avax`, `type: native`, `residency: native` and `decimals: 18`.
Its Ergo counterpart must have a nonzero lowercase 64-character hexadecimal
token ID and an integer decimal count from 0 through 18. Both IDs must resolve
uniquely to that set, and every member's decimal count must be a nonnegative
safe integer. The guard refuses an absent or ambiguous native mapping.

## Rosen Service configuration

Use the same chain, source and scan boundary as the selected Watcher and Guard.
The Service's warning and critical sync thresholds are flat health keys:

```yaml
healthCheck:
  avalancheScannerWarnDiff: <approved-warning-block-difference>
  avalancheScannerCriticalDiff: <approved-critical-block-difference>
avalanche:
  health:
    blockTime: <approved-block-time-seconds>
```

Both differences must be positive safe integers, with critical strictly greater
than warning. Replace each placeholder with an approved numeric value. The
Service rejects old `avalanche.health.warnDiff`/`criticalDiff` fields and missing
enabled thresholds. Disabled Avalanche does not read these optional keys. See
the Rosen Service README for the complete configuration and native token mapping.

Preserve the repository's `.gitattributes` rule for the Service default YAML
when preparing release copies. It keeps that file in LF format, which the
installed node-config YAML fallback requires on Windows.

## Settlement and scanner holds

The scanner qualifies execution against the RPC `finalized` frontier. A receipt
or a block visible through `latest` alone does not establish settled execution.
The `blockTime` setting is an operational health estimate, never a finality rule.

Each scanner persists its chain ID, source identity, initial height, settlement
policy and finalized frontier. A conflicting RPC response or saved history sets
a persistent hold. Restarting does not clear it. Old blocks without the required
qualification also cause a hold rather than being accepted as trusted history.

Run one writer per scanner database. After a hold, preserve the database and
record the hold reason, last processed block and finalized frontier. Resolve the
provider or history conflict before preparing a reviewed recovery procedure.
Clearing the hold field, deleting history or changing `sourceId` is not a supported
recovery operation. Removing Avalanche configuration is also refused by a guard
that retains Avalanche state, including historical transactions and balances.

A local hold does not stop the Ergo cleanup clock. The reviewed cleanup sources
spend old unpaid triggers without revalidating the source event; the deployed
contract version and cleanup threshold must therefore be established separately.
Do not treat a guard retry or a scanner hold as protection against cleanup.

## Fuji endpoint qualification

These candidate endpoints passed bounded read-only checks on 2026-10-02:

| Provider reference                                                                 | Fuji C-Chain endpoint                               | Reported client    |
| ---------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------ |
| [Avalanche network documentation](https://build.avax.network/docs/primary-network) | `https://api.avax-test.network/ext/bc/C/rpc`        | AvalancheGo 1.15.1 |
| [PublicNode](https://avalanche.publicnode.com/)                                    | `https://avalanche-fuji-c-chain-rpc.publicnode.com` | AvalancheGo 1.15.0 |

The installed Scanner and Guard and the fee source read finalized and numeric
canonical blocks, native balance and nonce, fee data, a gas estimate and a
transaction with its receipt. Both endpoints supply the same signed transaction
bytes to the Guard. These observations are compatibility evidence for Fuji;
they do not establish an approved operator set or sustained availability.

Before activation, establish independent endpoint operation, required historical
depth, rate limits and the actual custody-contract gas policy. Give each selected
source a stable identity and exercise failover and conflict handling. The
zero-value estimate used here does not qualify a bridge payment. Mainnet
endpoints remain untested in this candidate.

## Parameterized endpoint inspection

The [endpoint inspection template](../config/avalanche-endpoint-inspection.template.json)
is disabled. Copy it to private operator configuration and fill the explicit
chain, source identity, endpoint, timeout, last height before scanning, known
successful transaction, lock address and expected lock-code SHA-256. Set
`enabled` to `true` only for the endpoint selected for this inspection. Keep
authentication in `AVALANCHE_RPC_AUTH_TOKEN`, which supplies a bearer header.
URLs containing embedded userinfo credentials or fragments are refused.

The code reference is SHA-256 of the binary bytecode, excluding the `0x` prefix.
Obtain it independently from the approved deployment reference. An EOA may
correctly return empty code; its expected hash must still come from that reference.
For a payment simulation, supply `payment` with exactly `from`, `to`, `value`,
`data` and `gasLimitCap`; addresses must be nonzero, `value` and the positive cap
are canonical lowercase hexadecimal RPC quantities, such as `0x0` or `0x5208`
without leading zeroes, and `data` is even-length hexadecimal
with a `0x` prefix. Leave `payment` as `null` when no approved simulation is available.
The cap bounds this estimate; apply Guard's separately approved multiplier and
slippage policy when validating its constructed payments.

Run under Node 22.18 or the compatible release runtime, from the Operation root:

```text
node scripts/inspect-avalanche-endpoint.mjs --policy <private-inspection-json>
node --test tests/inspect-avalanche-endpoint.test.mjs
```

The command checks the selected chain and `finalized` frontier, fetches transaction
objects for the first scan block and validates sampled extractor fields, then binds the supplied transaction and
successful receipt to a numeric canonical block, and compares lock code at the
captured numeric frontier. Optional gas estimation uses that same numeric state.
It rechecks the captured block and chain after the reads, rejects redirects and
limits each response to 20 MiB. Output records the sampled identities and reads.
Historical hashes must be unique, and transaction indexes must match block order. When the supplied
transaction belongs to the first scan block, both reads must agree on its block,
payload, addresses, value, nonce and index; the receipt must have the same index.
The disabled template and incomplete policies make no requests.

The request shapes follow Avalanche's
[block](https://build.avax.network/docs/rpcs/c-chain/eth/eth_getBlockByNumber),
[receipt](https://build.avax.network/docs/rpcs/c-chain/eth/eth_getTransactionReceipt),
[code](https://build.avax.network/docs/rpcs/c-chain/eth/eth_getCode) and
[gas](https://build.avax.network/docs/rpcs/c-chain/eth/eth_estimateGas) APIs,
verified on 2026-10-02. This observer supplements the installed Scanner/Guard
checks. One block and receipt sample does not establish complete historical
coverage, independent operation or sustained availability. A supplied code hash
does not authenticate its source, and a gas estimate does not approve a payment
or signing policy. Repeat qualification with each selected operator and the
actual deployment references.

## Fee backend configuration

The fee backend reads an optional `avalanche` section from its configuration.
An absent section or `avalanche.enabled: false` preserves the legacy fee path
and ignores the optional Avalanche fields. Existing Avalanche fee history still
requires an enabled policy; disabling the section does not remove that history.

With `avalanche.enabled: true`, provide every setting below:

| Setting                                                      | Meaning and accepted values                                                                                             |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `avalanche.chainId`                                          | Numeric `43113` or `43114`                                                                                              |
| `avalanche.rpcUrl`                                           | Explicit HTTP(S) C-Chain endpoint, without a URL fragment                                                               |
| `avalanche.requestTimeoutMs`                                 | Integer request timeout in milliseconds, from `1` through `2147483647`                                                  |
| `avalanche.gasBudget`                                        | Positive gas-unit budget as a canonical decimal string, at most uint256                                                 |
| `avalanche.margin.numerator`, `avalanche.margin.denominator` | Positive canonical decimal strings, each at most uint256; numerator must be at least denominator                        |
| `avalanche.activationDelay`                                  | Integer block delay from `0` through `2147483647`; added to the finalized Avalanche height                              |
| `avalanche.feeGuaranteeBlocks`                               | Integer retention guarantee from `1` through `2147483647` blocks                                                        |
| `avalanche.avaxPrice`                                        | Explicit positive decimal-string price of AVAX                                                                          |
| `avalanche.tokenPrices`                                      | Map from selected supported token IDs to explicit positive decimal-string prices, using the same quote currency as AVAX |
| `avalanche.networkFeeTriggerPercent`                         | Nonnegative decimal-string percentage, at most 256 characters, without exponent notation                                |

Price strings are limited to 256 characters; exponent notation is accepted with
an exponent from `-256` through `256`. Supply authoritative decimal values
independently of the legacy numeric price feed. Converting an already rounded
number to text does not restore its precision. A native AVAX fee asset must use
the same price value as `avaxPrice`.

The change trigger uses a strict percentage comparison: increases are measured
against the old fee and decreases against the new fee. Existing common settings
must also provide a positive integer guarantee within the same block-count range
for every legacy chain used in fee history.

Invalid enabled settings are rejected before database and token initialization.
Common backend configuration is still required when the application loads.
Generation then checks selected assets, their explicit prices, unique token
mappings, native AVAX decimals and Ergo counterparts. Passing startup validation
alone does not establish that an asset can produce a fee update.

## Fee publication review

Build the fee frontend with `NEXT_PUBLIC_AVALANCHE_FEE_PUBLICATION_ENABLED=true`
and `NEXT_PUBLIC_AVALANCHE_CHAIN_ID` set to `43113` or `43114`. Configure
`KV_REST_API_URL` and `KV_REST_API_TOKEN` on the server for the atomic publication
store. This view reads the entire publication in one request; legacy fee keys do
not supply missing fields.

For structural inspection, set server-side `MINIMUM_FEE_CONFIG_ADDRESS` and
`MINIMUM_FEE_CONFIG_NFT` from the approved fee contract deployment. The address
must be a valid Ergo address and the NFT a nonzero lowercase 64-character
hexadecimal token ID. These values must come from the operator's deployment
configuration, independently of the publication being inspected.

The report identifies the publication, computed transaction ID and each fee box
at its original input or output index. It displays encoded fee history and exact
integer amounts. Missing or invalid contract configuration leaves the report
unavailable; a transaction that conflicts with the configured contract is rejected.
Publication metadata may still be visible in either case.

Structural inspection checks encoding, fee boxes and register layout. It does not
establish publisher authenticity, freshness, fee economics or signing authority.
This view provides no QR code, transaction export or signing control. Economic
review requires independently obtained policy, prices, chain frontiers and prior
fee boxes; copying those values from the publication would not supply that check.

## Configured economic reference

To compare published Avalanche fee updates with a separately obtained reference,
configure both server-only environment variables:

| Setting                                 | Meaning                                                       |
| --------------------------------------- | ------------------------------------------------------------- |
| `AVALANCHE_FEE_REVIEW_AUTHORITY_FILE`   | Absolute path to a JSON file on the server's local filesystem |
| `AVALANCHE_FEE_REVIEW_AUTHORITY_SHA256` | Lowercase hexadecimal SHA-256 digest of the exact file bytes  |

The UTF-8 JSON file must be at most 8,000,000 bytes and contain exactly five
top-level fields: `schemaVersion` set to `1`, numeric `chainId` matching the
configured network, `publicationId` matching the publication, `policy` and
`observations`. For their complete field definitions, see
`TrustedAvalancheFeePolicy` and `TrustedAvalancheFeeObservations` in the fee
frontend's `services/frontend/src/avalanche/economics.ts`. Duplicate object keys
are rejected at every depth, including names that match after JSON escape decoding.

The following complete example matches the synthetic new-fee fixture in
`minimum-fee-job/services/frontend/tests/testUtils/avalancheEconomics.ts`.
Save it as `avalanche-fee-reference.json` to inspect the format. Its addresses,
identifiers, heights, prices and fee policy are test values; obtain the approved
policy and observations independently before using the comparison operationally.

```json
{
  "schemaVersion": 1,
  "chainId": 43113,
  "publicationId": "7dc7f3a9514dd516b270bce5c85c296562e012c7999fb2df2ddbd5ec9bc557d3",
  "policy": {
    "contract": {
      "expectedChainId": 43113,
      "minimumFeeAddress": "9fSgJ7BmUxBQJ454prQDQ7fQMBkXPLaAmDnimgTtjym6FYPHjAV",
      "minimumFeeNFT": "1212121212121212121212121212121212121212121212121212121212121212"
    },
    "rawTokenMap": [
      {
        "avalanche": {
          "tokenId": "avax",
          "decimals": 18,
          "name": "AVAX",
          "type": "native",
          "residency": "native",
          "extra": {
            "note": "metadata",
            "scale": 1,
            "active": true
          }
        },
        "ergo": {
          "tokenId": "abababababababababababababababababababababababababababababababab",
          "decimals": 9
        }
      }
    ],
    "selectedTokenIds": ["avax"],
    "gasBudget": "1000000000000000000",
    "margin": { "numerator": "1", "denominator": "1" },
    "activationDelay": 5,
    "history": {
      "chains": ["avalanche", "ergo"],
      "guarantees": { "avalanche": 20, "ergo": 20 }
    },
    "common": {
      "avax": {
        "bridgeFee": "1",
        "rsnRatio": "2",
        "rsnRatioDivisor": "1000",
        "feeRatio": "3"
      }
    }
  },
  "observations": {
    "finalized": {
      "chainId": 43113,
      "height": 100,
      "hash": "0x0101010101010101010101010101010101010101010101010101010101010101"
    },
    "quote": {
      "chainId": 43113,
      "baseFeePerGas": "1",
      "maxPriorityFeePerGas": "1",
      "maxFeePerGas": "3"
    },
    "frontiers": { "avalanche": 100, "ergo": 100 },
    "prices": { "avax": "2", "tokens": { "avax": "2" } },
    "priorFeeBoxes": {
      "abababababababababababababababababababababababababababababababab": null
    }
  }
}
```

`priorFeeBoxes` is keyed by the **Ergo counterpart token ID**, even when the
selected Avalanche token is `avax`. Include exactly the counterparts checked by
the publication. Use `null` only when the transaction has no existing fee-box
input for that counterpart. For an existing input, supply the canonical base64
encoding of the complete Sigma-serialized Ergo box, obtained independently:

```js
const priorFeeBox = Buffer.from(ergoBox.sigma_serialize_bytes()).toString(
  "base64",
);
```

The comparison requires those exact serialized input bytes. A box ID, JSON box
description, different box with the same token, or noncanonical base64 is
rejected. When changing from creation to update, use the update publication's
`publicationId` and its independently obtained policy and observations as well
as the existing box bytes.

After saving the final UTF-8 file, calculate its digest from the exact bytes:

```powershell
node --input-type=module -e 'import { readFileSync } from "node:fs"; import { createHash } from "node:crypto"; console.log(createHash("sha256").update(readFileSync(process.argv[1])).digest("hex"));' ./avalanche-fee-reference.json
```

Set `AVALANCHE_FEE_REVIEW_AUTHORITY_FILE` to the resolved absolute server path
and `AVALANCHE_FEE_REVIEW_AUTHORITY_SHA256` to this digest. Recalculate it after
any byte change, including formatting or line endings. Both settings belong to
the server process, rather than the browser environment.

Obtain this reference independently of KV and the publication's `feeEvidence`.
The server captures the file before requesting the publication, then checks its
digest and the configuration again before returning a response. The digest
identifies the chosen bytes; it does not attest their provenance or the freshness
of their observations.

A match means that the published Avalanche updates match the configured
reference. Other fee targets receive structural inspection only. The comparison
does not establish that all needed updates were published, and provides no
signing or export control.

## Release requirements

For node provisioning, consult Avalanche's
[system requirements](https://build.avax.network/docs/nodes/system-requirements),
verified on 2026-10-02. Its Primary Network validator reference lists 4 cores /
8 threads, 16 GB RAM, 1 TB local NVMe and symmetric 100 Mbps for the lower tier;
the higher tier lists 8+ cores / 16 threads, 32 GB RAM, 2 TB NVMe and 1 Gbps.
These are validator references. Measure the chosen RPC workload and its storage
needs separately.

The [state-management guide](https://build.avax.network/docs/nodes/node-storage/chain-state-management)
distinguishes current-state nodes from full historical state, estimated at
roughly 12.5–13 TB. An archival node started through state sync retains state
from its checkpoint, rather than all state from genesis. Qualify block bodies,
transaction receipts and every historical query required from the selected
observation start height. The bridge's current-state balance reads alone do
not establish that older observation data is available.

Before activation, close payment observation, completion, invalidation and
recovery validation against the final service build; qualify the fee publication
economics and signing consumer; and test the complete service lifecycle with the
selected database backend. Local PostgreSQL 17.11 validation applies all forty
Service migrations and twenty-two entities, persists a synthetic native AVAX
observation and reloads its qualified frontier through a new connection. It also
tests altered persisted state and schema recovery. A separate original Service
process proof restarts both PostgreSQL and Service and preserves the exact
observation, frontier, block and asset records. Its actual Avalanche scanner,
extractor, calculator and health producer run against synthetic loopback inputs;
eight unrelated chain starts are isolated. The physical release-preview Service
also passes independent compilation, legacy entity registration, PostgreSQL
queries, startup/restart and held-state, wrong-chain and scanner-noop refusal
checks. Repeat the deployment acceptance steps against the actual published
packages, selected database and operator configuration before activation.

The release must pin compatible watcher, guard, scanner, address-codec, fee and
UI packages, then identify the destination byte, deployed contracts, assets,
confirmation policy and approved operator identities. Published package version
numbers alone cannot reproduce local package overlays. Read-only Fuji RPC checks
do not establish contract deployment, signing readiness or bidirectional bridge
operation.

## Release sequence

1. Freeze the mainnet AVAX and mapped standard ERC20 scope, exact candidate sources and the
   applicable requirements matrix. Run the repository checks against those
   inputs; retain archives, source bindings, package hashes, test identities and
   the unresolved deployment inputs with the release candidate.
2. Apply the authentic Changesets plan in an isolated copy. Release codec and
   database/scanner producers before their observation consumers, and release
   Avalanche chain/RPC and shared-health packages before Watcher and Guard.
   Release matching UI constants, utilities, EVM/Avalanche network and wallet
   producers before their App and Service consumers. Use the exact dependency
   graph in the generated plan. For UI, use the complete unscoped plan in the
   release copy. Some packages are private and are not registry publication
   targets. Existing scoped scripts reject mixed
   ignored/selected changesets, including pre-existing entries, so they are not
   the prepared release path. From the UI release copy, inspect and apply:

   ```text
   npm exec -- changeset status --output release-plan.json
   npm exec -- changeset version
   npm run bootstrap
   npm run build --workspace=@rosen-bridge/rosen-app
   npm run bootstrap --workspace=@rosen-bridge/rosen-service
   npm run type-check --workspace=@rosen-bridge/rosen-service
   ```

   Compare generated versions, dependency minimums and changelog history with
   that plan before publishing. These commands prepare release bytes; registry
   publication still needs its authorization and dependency order.
   The earlier native preview's package counts and versions do not describe the
   complete ERC20 candidate. Regenerate plans after applying the selected series.
   In UI, apply the separate interfaces, statistics and EVM bounds prerequisites
   before the Avalanche contribution; the optional portable-test patch is a
   separate tooling contribution. Keep required UI base registrations grouped.
   Use each repository's full plan and preserve historical changelogs. New
   packages start at `0.0.0` with an initialization changeset; existing package
   versions come from Changesets. Compare every emitted archive and its metadata
   before consumer installation. Private workspace builds and public registry
   availability have separate acceptance checks.

3. After authorized producer publication, verify each required version and
   registry integrity value, update the consumer lockfiles and perform clean
   installation, build and consumer validation against those public bytes.
   `npm ci` must use the resulting reviewed lockfile. A local archive preview
   cannot provide missing registry integrity values.
4. Assemble private operator configuration from one approved deployment:
   destination byte, lock and cold custody addresses, Ergo contracts, counterpart token,
   RWT and config/NFT identities, selected RPC operators, scan start, fee and
   confirmation policy, and genuine signer/ceremony outputs. Use the parameter
   names above and the Rosen Service reference. Keep runtime Avalanche disabled
   until those inputs pass their respective readers and acceptance checks.
5. Qualify each endpoint with the configured first scan height, known receipt,
   code reference and intended payment simulation. Establish the rest of the
   required historical range, limits, availability and independent operation
   separately. Review the deployed Ergo cleanup threshold and contract version;
   scanner holds do not extend that clock.
6. On an isolated database using the selected backend, apply the complete
   migrations, start one Service writer, ingest a controlled finalized
   AVAX and mapped-token observations and check scanner state, AVAX gas, token
   custody balance, counterpart issuance, calculator and health.
   Restart the database server and Service process, then compare the same
   observation, completed block and qualified frontier. Check source/chain/hold
   contradictions before permitting downstream use; populated rollback must
   preserve safety state. Repeat this procedure against the final installed
   release, rather than substituting a source fixture for it.
7. Obtain the required deployment and funds authorizations before activating
   the configured bridge. Exercise the approved end-to-end payment, observation,
   completion, duplicate, invalidation and recovery procedures in both
   directions, recording the actual deployed versions and transaction outcomes.
   Rosen acceptance, merge, release and activation are separate recorded states.
