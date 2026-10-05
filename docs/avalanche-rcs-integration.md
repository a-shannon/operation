# Avalanche C-Chain: Rosen integration review

Author: A. Shannon

Verified: 2026-10-05

Status: mainnet and ERC20 contributor implementation in progress; local validation covers the stated components

The candidate targets Avalanche C-Chain mainnet (`43114`) with native AVAX and
mapped standard ERC20 assets. JOE is the first non-stable token example. Fuji
(`43113`) is an optional profile of the same implementation. The current work
uses local simulation and parameterized deployment preparation; it does not
establish a deployed bridge, published package compatibility or Rosen acceptance.

Deployment remains disabled.

The current corrective candidate passes 711 Avalanche chain cases, 34 cold
storage cases, 102 admission/verifier cases and 161 actual PostgreSQL management
cases. Independent review closes interrupted approval recovery and native
cold reserve/gas planning at the stated boundaries. Guard health has 90 author
cases, including actual AVAX/JOE RPC and persisted scanner consumers; independent
review replays 90 cases and detects three mutants. Service calculator PostgreSQL
persistence has six author and six independent cases. A separate mainnet JOE
run starts the actual Service process with complete merged configuration,
persists its observation and AVAX/JOE accounting, and preserves them across
actual PostgreSQL and Service restarts. Transport is synthetic; unrelated chain
starts are isolated, and dependencies use private compiled overlays.

The actual Watcher now passes its declared npm-start route, real SQLite
migrations, mainnet JOE observation and process restart. A portable replay
preserves the same positive observation across restart and rejects removed or
missing removal flags. It isolates unrelated scheduled jobs and uses the local
installed dependency graph. The existing bridge form also passes an unsigned
JOE transfer, insufficient AVAX refusal and wrong-wallet-network refusal on the
selected UI tree. Neither result qualifies a normal registry installation.

Actual ethers receipt formatting exposed loss of the raw log `removed` field.
The Avalanche connector now retains that field from the same RPC response;
the unchanged proof still admits only explicit `false`. Independent actual
SDK/scanner/SQLite checks cover six flag values and detect an omission mutant.
Watcher consumes the complete merged contracts/token map in ten independently
replayed factory, observation and persistence cases. The contract merger's
cross-deployment identity collision is corrected and independently closed.

The UI contribution is prepared as separate generic prerequisite patches and
one Avalanche patch. Independent exact review covers 181 source pins and 164
selected files, eight patch applications, required artifact/import closure and
publication guards. Operator guidance is outside UI. Guard balance candidates
reuse the existing network cards, EnhancedTable, row renderers and pagination;
the separate interaction prototype remains excluded. Lock-only consumer checks
pass 9 positive/20 refusal network cases, 6 positive/25 refusal Assets cases and
28 source-owned network tests. Cold collection and response wiring use the
existing qualified chain reader. Five package builds and
the actual Guard production build pass on a private installed graph. The explicit
deployment successor passes20 independent backend controls,60 normal public-export
decoder cases and10 actual component controls. Its complete composed source
build passes for1,627 source files. Nine actual browser scenarios verify
mainnet/Fuji links, native cards, mobile cold expansion, independent page sizes,
valid-empty cold and unavailable-data branches. Missing links and misleading
unavailable pagination are corrected. Those nine scenarios use a recorded backend
response. A further browser join consumes the final Guard's actual PostgreSQL
balance cache and API: AVAX and JOE show3.0 in both tables, independent page sizes
work, native cards link to the configured addresses, and mobile cold expansion
preserves the amount and links. Six fresh ordered
UI patch applications now include the Service extractor floor7.2.0 and the Utils
helper's four tests in its prerequisite. Fee ordinary clean installation and fixture preparation
pass; the complete declared route passes1,176 cases in33 files through15 jobs,
with an independent review of the three installed fixture corrections.
Configured Guard startup reaches actual index/API/P2P/TSS transport. An
Avalanche-only bounded health-read join corrects the concurrent reader conflict
while preserving exclusive action admission: scanner59 and Guard18 pass,
independent review adds four controls and detects five mutants, and actual
normal/sequential dispatch passes AVAX, JOE and scanner in four cycles. Its
deadline covers queueing and the qualified read. The exact final Guard startup
and API/browser join pass; all eight owned ports are released. TSS signing still
requires genuine ceremony outputs. The existing dashboard TokensCard displays
JOE amounts but has no port for a deployment-aware token link. Its proposed
component contract and acceptance fixtures are prepared outside UI; Rosen must
supply that contract before the App can consume it.
The [token explorer port proposal](../contribution/avalanche-token-explorer-port-20261005/README.md)
contains the installed-interface proof, ten fixtures and a local replay command.
It prefers forwarding an explicit URL from the validated network reader through
an optional token-item field; Rosen's chosen contract remains the prerequisite.
The following
matrix retains earlier component results only where their inputs are unchanged.

## Requirements baseline

The current baseline is `rosen-bridge/rcs` revision
`7b9784dae9d8d5b66b80de7a6043d1ba36a3a4bf`, verified on 2026-10-04:

- [RCS-001: TypeScript tests](https://github.com/rosen-bridge/rcs/blob/7b9784dae9d8d5b66b80de7a6043d1ba36a3a4bf/rcs-001.md)
- [RCS-002: contribution conventions](https://github.com/rosen-bridge/rcs/blob/7b9784dae9d8d5b66b80de7a6043d1ba36a3a4bf/rcs-002.md)
- [RCS-003: Bridge Expansion Kit](https://github.com/rosen-bridge/rcs/blob/7b9784dae9d8d5b66b80de7a6043d1ba36a3a4bf/rcs-003/README.md)
- [RCS-003: extending network APIs](https://github.com/rosen-bridge/rcs/blob/7b9784dae9d8d5b66b80de7a6043d1ba36a3a4bf/rcs-003/new-network.md)

`guard-service/README.md` directs contributors to the Bridge Expansion Kit.
The UI README links to a missing CONTRIBUTING file, so additional requirements
from that file have not been established. Paths below are relative to the
combined source root. The contract repository is labelled `contract`.

Use the [operator guide](avalanche-c-chain.md),
[contract preparation procedure](avalanche-contract-preparation.md) and
[validation evidence](avalanche-validation-evidence.md) with the scopes stated
here. The earlier V5 export covers native-only sources; it is historical evidence
and is not a portable mainnet/ERC20 successor.
The [contributor source handoff](../contribution/avalanche-contributor-handoff-20261005/README.md)
selects the final tree for each of ten repositories and gives eight separate
application commands. It excludes superseded Guard/contract outputs and
distinguishes the UI-owned Service runtime from its complementary Operation
replay kit. Do not stack the historical source series onto those final trees.

The implementation builds on these upstream revisions. Token changes are
identified by their component paths and validation scopes below. At an earlier
producer checkpoint, eight patches covered signing, SQLite ownership, generic
replay/timeout and Avalanche codec/scanner registration. All eight applied to
clean copies; generic replay passed 41 Ethereum/Binance cases before Avalanche,
then 43 after registration, with four producer builds. The selected contribution
now comprises eight series across ten repositories, as mapped above.
Complete Changesets status/version preparation derives 26 plan entries:
23 version changes and three unchanged entries across these repositories,
including the pending notes already present at their pinned baselines.
Independent producer split review is closed, including the complete changed-path
inventory and the Avalanche raw-provider changeset. The portable
[producer contribution series](../contribution/producer-series-20261004/README.md)
reproduces all eight applications and three isolated refusals, with no original
index writes; its publication guard passes. Authentic sequential scanner release
preparation derives extractor 7.1.0 for the shared prerequisites, then 7.2.0 for
Avalanche and provider 0.3.0 with minimum extractor `^7.2.0`. These are previews;
actual releases and registry exports remain required. The health successor is in
[producer-health-series-20261005](../contribution/producer-health-series-20261005/README.md).
Its complete and sequential Changesets rehearsals preserve existing notes and
derive extractor7.2.0, scanner2.1.0, abstract scanner4.0.1 and raw provider0.3.0.
Versioning leaves17 stale workspace lock entries; regenerate them through the
ordinary registry route after approved producer releases.

Four further bounded patches cover generic gas policy, generic RPC, Avalanche
health and contract preparation. Independent fresh application and validation
pass 69 gas-policy, 38 RPC and 56 health cases; the contract sources match their
retained independent checks. Complete release preparation derives prerequisite
floors `@rosen-chains/evm ^10.1.0` and `@rosen-chains/evm-rpc ^4.1.0` for the
Avalanche consumers. These calculated floors remain release previews.

| Repository | Source revision |
| --- | --- |
| contract | `4302d8d34020b0012c3fcb25d7484aa602813cab` |
| guard-service | `b1f5ab6f81435053a979e8078eb098d8ec1f5a47` |
| health-check | `8612db85d00db32651a5fbaa9bde7dd075a651e3` |
| minimum-fee-job | `de706245e439506ef55697b64caf6605cadf5171` |
| operation | `f0634e155bc83db7477a0a54a42cf70bc9b83b63` |
| scanner | `8f3a4e35c0dab5763a0f89a9903357261e5e55a5` |
| sign-protocols | `243f5882e6c589f8e1fc16b5887d0a1162fbf89c` |
| ui | `d62818e0c5e3e3452454f07def81059b14c784f9` |
| utils | `28e3bd960d10b662eef3c05c29e11e0acb9372ae` |
| watcher | `4552b29b95dd48947f85406857641b1ecb2e5490` |

## Adopted design

AVAX remains the gas asset for native and token transactions. Each mapped asset
has an unambiguous token set, exactly one native origin and a wrapped Ergo
counterpart. EVM identifiers are compared without case ambiguity; decimal
conversion is exact and must refuse amounts that cannot be represented.
The first token is JOE at
`0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd`, with 18 decimals.
LFJ identifies JOE as its governance token and lists this Avalanche deployment
in its [official token documentation](https://docs.lfj.gg/additional-information/brand-and-ecosystem-information/joe_token_emissions_6793324).
Non-standard transfer behavior needs separate qualification before another
asset can be admitted under this standard ERC20 policy.

The route is wallet -> EVM lock transaction and Rosen metadata -> finalized
scanner -> network extractor -> observation -> Guard universal extractor ->
settlement. Amount, asset, destination and request identity must survive every
join. ERC20 locks call the selected token's `transfer` with Rosen metadata after
the ABI arguments; an Ergo return lock uses the mapped wrapped token and
`avalanche` in R4. These representations reuse Rosen's EVM and Ergo producers.

A successful receipt and decodable calldata do not prove token movement.
The Avalanche observation extension requires one standard `Transfer` from
the selected token contract, binding the signed sender, lock recipient and raw
amount to the transaction, receipt and scanned block. It rejects missing,
removed, malformed, duplicate or conflicting evidence. The generic EVM
extractors continue to decode metadata; their compatibility alone does not
qualify the Guard's outgoing ERC20 receipt or recovery path.

The Guard uses EVM type-2 envelopes and its ECDSA mediator. Payment and
cold/manual/arbitrary management routes retain separate admission, signing
and execution authority. Token management has local business, signing and
SQLite and dedicated PostgreSQL consumer checks. Token payment completion and
unsigned recovery now require exact Transfer evidence through their local DAO
consumers. JOE management also has database restart evidence; independent review
closes the repaired admission, recovery/cold and health boundaries; final
installed-service qualification remains open.
Token spending must leave the required AVAX reserve available for gas.

The scanner reads `finalized`, persists its frontier and hold state, and refuses
conflicting history. Its lease protects a single process, not a distributed
database deployment. Nonce reservations and the configured parallel limit
replace UTXO chaining on C-Chain. One RPC implementation can use several
independent operators' endpoints; availability and operator independence must
be established for the selected deployment.

Contract preparation reuses Rosen's existing Ergo generator and ten unchanged
ErgoScript sources. It accepts assigned identities and custody parameters,
compiles offline, and emits AVAX/JOE map and contract overlays. The merge
extension must preserve existing chains, global identities and versions while
refusing collisions. Local generation is contributor work; minting, deployment
and public key-ceremony outputs remain Rosen's final actions. No additional
chain-side Solidity contract is required by this design.

Fee verification combines EVM gas policy, native reserves and explicit operating
limits. Existing mapped-token fee joins cover both network profiles and 18/9/6
decimal maps. Independent fee-map admission and token treasury health checks
pass at their stated producer/consumer boundaries.
A scanner hold does not stop cleanup of old
unpaid Ergo triggers; the deployed cleanup configuration has separate consequences.

## Chain function design

`AvalancheChain` inherits the EVM account model. This map names the provider
inputs needed by each AbstractChain boundary. It describes the selected design;
token receipt, recovery and management rows remain subject to the checks in the
requirements matrix.

| Chain functions | Design | Provider or retained input |
| --- | --- | --- |
| `generateTransaction`, `generateMultipleTransactions` | Create native or selected-token type-2 envelopes; exact decimal conversion, AVAX reserve, event suffix and nonce/parallel checks | Network identity, native/ERC20 balance, `getGasRequired`, `getFeeData`, `getAddressNextAvailableNonce`; active pending envelopes |
| `getTransactionAssets`, `extractTransactionOrder`, `verifyNoTokenBurned` | Decode canonical native value or mapped transfer calldata and compare required assets/orders without rounding | Signed/unsigned envelope, immutable selected map and policy; no remote read needed for decoding |
| `verifyTransactionFee`, `verifyTransactionExtraConditions` | Check configured gas limit/cap/multiplier, fee shape, route, chain, sender/custody and event identity | Frozen configuration and map; native/token generation uses qualified fee/gas reads |
| `verifyEvent`, `verifyLockTransactionExtraConditions` | Check source inclusion, canonical extracted fields and additional Avalanche lock evidence | `getBlockTransactionIds`, `getTransaction`, `getBlockInfo`; exact transaction/receipt/block Transfer join for ERC20 |
| `isTxValid`, `verifyPaymentTransaction` | Retain event/order and envelope identity; outgoing token completion requires the exact selected transfer and settled evidence | Canonical transaction and receipt/finality reads; actual token payment completion/recovery DAO consumers pass |
| `signTransaction`, `isTransactionInSign` | Sign only within retained purpose-specific authority; preserve signer identity and pending-attempt state | ECDSA mediator and retained policy/configuration/scanner authority; no independent signer cache shortcut |
| `getTxRequiredConfirmation`, `getTxConfirmationStatus` | Use explicit per-purpose confirmation counts and finalized source evidence | Configured observation/payment/cold/manual/arbitrary counts; `getTxConfirmation` |
| `getAddressAssets`, `getLockAddressAssets`, `getColdAddressAssets`, `hasLockAddressEnoughAssets`, `getMinimumNativeToken` | Read selected native/token balances and require separate AVAX gas funding with exact map conversion | `getAddressAssets`, finalized `getAddressBalanceForNativeToken` and `getAddressBalanceForERC20Asset`; configured custody/reserve |
| `getHeight`, `getTokenDetail` | Return qualified chain height and selected token metadata | `getHeight`, `getTokenDetail`; network and token identity |
| `submitTransaction`, `isTxInMempool`, `getActualTxId` | Start submission within retained authority; reconcile canonical hashes without another payout | Qualified submission, `getMempoolTransactions` and `getActualTxId`; receipt/history recovery inputs |
| `PaymentTransactionFromJson`, `rawTxToPaymentTransaction`, `serializeTx` | Preserve canonical raw envelope and chain/event/order identity during conversion | Exact chain/provider transaction representation and map; failed conversion refuses |
| `getChainConfigs`, `getRWTToken` | Expose the selected configuration and supplied RWT identity | Validated configuration only; actual deployment identities are supplied later |

Native cold/manual/arbitrary management uses those same reserve, envelope,
signing and submission boundaries with its own purpose authorization. ERC20
management generation, extraction, signing, funding and settled proof pass
chain tests. Guard token authorization, signing and SQLite consumers also pass
their affected suites. The automatic cold producer budgets AVAX gas before
choosing a native amount and qualifies the selected asset through actual request
admission. Dedicated PostgreSQL management and JOE arbitrary restart checks pass;
independent recovery/cold review is closed; full installed-service qualification
remains pending.

## Requirements matrix

This is the current requirements-to-evidence mapping. Results cover only the
named producer and consumer inputs; passing a native fixture does not close an
ERC20 requirement. Every locally executable or preparable item remains with
the contributor. Deployment allocations are late inputs to those prepared
interfaces, not a reason to defer implementation or deterministic tests.

| Requirement and source | Authority class | Applicability | Design and path | Validation or command | Current result and candidate | Remaining work and owner |
| --- | --- | --- | --- | --- | --- | --- |
| Single integration document; RCS-003 Requirements | Explicit requirement | Applies to the whole mainnet/AVAX/ERC20 contribution | This document; linked operator, contract and validation guides | Compare the final source inventory with every row | Current implementation, local checks, portable series and external owners recorded on2026-10-05; full Rosen acceptance is not established | Contributor: keep exact changed-input evidence current; Rosen: review this document |
| RCS document review before chain code review; supplied Rosen UI feedback, 2026-10-04 | Observed maintainer review direction; standing contribution gate | Applies before code-review readiness is claimed | This integration document and its exact final revision | Record actual Rosen reviewer, review result and addressed design findings | Pending: no Avalanche document-review evidence supplied | Contributor: finish and correct the document; Rosen: review and resolve scoped design findings |
| Focused contribution purpose and no equivalent rewrites; supplied Rosen UI feedback, 2026-10-04 | Observed maintainer review direction; standing contribution gate | Chain implementation and required wiring belong together; independent shared behavior needs separate contributions | Exact upstream diff and path/hunk dispositions | Compare the selected candidate with its target base, including required artifacts absent from the diff | UI six-group successor and Guard13-group source series apply exactly. Generic signing consumers are separate from Avalanche core/wiring. Independent Guard review covers293 outputs,59 executable comparisons and retained callbacks. Equivalent ORM sorting and tooling churn are excluded | Rosen: accept the proposed dependency order and review each separate contribution |
| Network/wallet ownership and reuse; supplied Rosen UI feedback, 2026-10-04 | Observed maintainer review direction; accepted source precedent | App wires existing package interfaces; network owns chain reads/construction/fees and wallet owns session/signing/transfer | Avalanche network, MetaMask and thin App actions | Actual Doge/MyDoge and Firo caller-to-callee trace at UI `289d6d7bd1f09f8a6b1e3c5d88286e3d8e5f454d`; affected package/App consumers | Network owns provider, action factory and transfer calculation; wallet owns session, account and send. Independent compiled before/after comparison preserves six chain queries, 43 wallet requests and two synthetic AVAX/JOE sends; affected package types/builds pass | Local App/browser route and compiled package comparison pass. Contributor: qualify ordinary build after approved producer releases |
| Existing or team-supplied UI interaction; supplied Rosen UI feedback, 2026-10-04 | Observed maintainer review direction; standing contribution gate | Guard balances and fee table/QR use existing components | Existing network cards, EnhancedTable, MobileRow/TabletRow, TableSkeleton and fee Validations/Qr | Actual public-helper links, bigint decoding, independent pagination and joint publication consumers | Backend20, UI60, component10, composed1,627-source build, nine recorded browser scenarios and final live cache/API desktop/mobile join pass. Fee installed route passes1,176 cases. Assets token/address links work. Installed TokensCard6.1.0 has no deployment-ID or per-token URL port; dashboard JOE link remains absent | Preparation: minimal token-link contract, fixtures and acceptance outside UI. Rosen UI: decide, implement and release the port; contributor: connect it after release and rerun affected checks |
| Published external producers before normal consumer qualification; supplied Rosen UI feedback, 2026-10-04 | Observed maintainer review direction; package/build contract | External npm dependencies; private UI workspaces instead use normal workspace builds | Producer release sequence and ordinary lockfiles | Exact registry versions, normal clean install/build after release | Pending: read-only official npm checks on 2026-10-05 return 404 for Avalanche RPC0.1.0, EVM scanner2.1.0 and the corrected EVM extractor7.2.0 floor. Complete private Changesets previews and overlays remain preparation | Contributor: execute ordinary lockfile/install/build checks after approved releases; package owners: publish the required producer versions and exports |
| Documentation outside UI; supplied Rosen UI feedback, 2026-10-04 | Observed maintainer review direction; standing contribution gate | Single review entry point and operator guidance; ordinary package READMEs remain applicable | This operation document and guides | Inspect exact UI diff for an added integration dossier or endpoint advice | Independent selected-diff review finds no new integration dossier or endpoint advice in the UI series. Ordinary six-line package README retained; extended operator guidance is preserved in Operation | Contributor: retain this boundary in the final export and exact promotion check |
| Multi-signer custody; RCS-003 Requirements | Explicit requirement | AVAX and admitted ERC20 balances | Guard `AvalancheChain`, retained signing runtime and configured lock/cold custody | Token admission, installed signer boundary and owned SQL transitions | Management PostgreSQL161 and independent recovery/authority checks pass; earlier351-case scope is retained only for unchanged inputs. Final configured service and exact Guard export pass; genuine signing shares are absent | Preparation complete for the stated local boundary. Rosen: actual ceremony, shares and deployed custody; no live signature validation claimed |
| Lock data and examples before extractor work; RCS-003 Requirements and Network-based Rosen Extractor | Explicit requirement | Both AVAX and ERC20, both directions | EVM/Ergo producers; examples below; Utils EVM/Ergo extractors | Exact nine-field producer/extractor round trip; malformed asset/amount/destination controls | Independent source-owned replay matches frozen JOE metadata, calldata, envelope identity and Ergo box/R4, with nine fields each direction and six isolated refusals. Twenty-six recorded input pins have no drift. JOE examples precede token observation work; native examples postdate their extractor work | Rosen: decide the native chronology exception. Source-owned replay and current consumer joins are prepared and locally validated |
| Multiple independent endpoints; RCS-003 Requirements | Explicit requirement | Mainnet operating deployment | RPC adapters; `operation/scripts/inspect-avalanche-endpoint.mjs` | Parameterized endpoint/history/receipt/code inspection; disabled and incomplete inputs refuse before fetch | Parameterized mainnet inspection profile and48 loopback plus42 refusal/transport controls are prepared. Local scanner history/hold/disagreement/restart checks support semantics; they do not establish mainnet endpoint independence | Operators: select infrastructure, historical range and independent operation; execute the supplied inspection and acceptance procedure |
| Tokens and wrapped Ergo counterparts; RCS-003 Requirements and Contracts | Explicit requirement, conditional clause applies | AVAX and mapped standard ERC20, JOE first | Guard `avalancheAssets.ts`; UI `tokenPolicy.ts`; contract token overlay | Official generated map through Tokens 6.0.2; invalid origin/type/alias/decimals refusals | Complete merged AVAX/JOE fixtures pass Guard/UI/Watcher/Service. Independent merger review closes mixed-case identity collisions; positive outputs remain identical. Five-path contract export applies exactly and its62-case serialized replay passes | Rosen: final minted counterpart/config/NFT identities; contributor: substitute supplied values and run prepared checks |
| Wallet access; RCS-003 Requirements and UI Wallet package | Explicit requirement | MetaMask for native and token locks | `ui/wallets/metamask`; App wallet configuration and asset selection | Wallet ERC20 balance/transfer and AVAX gas qualification; provider identity/currentness negatives | 110 author cases pass. Independent package-ownership review preserves the generated-map route, 43 provider requests and two synthetic sends. Current existing-form browser intercepts one unsigned JOE transfer; low AVAX and wrong wallet network produce zero sends. No signature or broadcast | Contributor: ordinary installed graph after producer publication; real extension acceptance remains separate |
| Concurrent requests and event identity; RCS-003 Requirements | Explicit requirement for distinguishability; chaining conditional | Account nonces apply; UTXO chaining is N/A | Guard canonical event/envelope identity, nonce reservations and scanner state | Signed pending ERC20 event suffix, nonce/maxParallel, duplicate and recovery cases | Token nonce/event suffix, settlement and unsigned recovery retain earlier scoped checks. Periodic AVAX/JOE interrupted-order recovery now passes actual PostgreSQL processor cases, independent owner-lock controls and drift negatives | Contributor: retain exact payment/recovery pins in the installed-service/export closure; operators: configure parallel and confirmation policy |
| Fee handling; RCS-003 Requirements | Explicit requirement | AVAX gas for every payment; selected token amounts and minimum fees | Guard gas/reserve policy; fee backend/frontend | Actual RPC/fee-register/frontend mapped joins, selected map refusals and unavailable/expired fee reads | Earlier affected fee selectors pass1,180 cases at their retained scope. Current normal installed fixture route passes1,176 cases in33 files through15 jobs. Independent four-control fixture review and prior serialized/economic checks remain scoped; counts overlap | Local source/fixture/release preparation complete. Ordinary release-selected graph qualification follows producer publication; operators: final approved ranges/confirmations |
| Scanner; RCS-003 Scanner, EVM Chain and new-network Scanner | Explicit requirement; EVM reuse provision | Finalized C-Chain transactions for AVAX and ERC20 | `scanner/packages/scanners/evm-scanner/lib` Avalanche connector/scanner and persisted state | Actual SDK, canonical receipt, history/hold/restart and resource-budget checks | Avalanche connector preserves raw removal flags through actual ethers formatting; 134 author scanner/network cases pass. Independent six-value SDK/scanner/SQLite checks and an omission mutant close that boundary. Current Service process and Watcher persistence joins cover mainnet JOE | Current source-owned Watcher/Service replay and producer health8 export are closed. Normal installed graph follows releases; module placement remains a proposed deviation |
| Address codec; RCS-003 Address Codec and EVM Address Codec | Explicit requirement | Reuse EVM addresses; no new encoding | `utils/packages/address-codec/lib/{encoder,decoder,validator}.ts` | Native and JOE examples; invalid/case-ambiguous address controls | Existing Avalanche registrations reused; mainnet JOE generic example decodes | Contributor: preserve real production index assignment as a late input; Rosen: allocate destination byte |
| Network-based and universal extractors; RCS-003 Rosen Extractor and EVM Rosen Extractor | Explicit requirement | Same nine fields from provider transaction and serialized Guard envelope | Utils registered EVM extractors; Avalanche chain/provider transaction types | Cross-extractor round trip and conversion failures | Independent source-owned JOE replay passes both EVM and Ergo extraction, nine fields each direction and six isolated refusals. Payment/recovery446 and admission/management evidence retain their stated inputs | Locally validated and portable; ordinary released-graph qualification follows producer publication. Generic metadata extraction does not prove receipt inclusion |
| Observation extractor; RCS-003 Observation Extractor and EVM Observation Extractor | Explicit requirement | New ERC20 proof adds behavior, so tests apply | `avalancheRpcObservationExtractor.ts`, `avalancheTransferProof.ts` in EVM observation package | Canonical class spec and independent Transfer-proof counterexamples/mutants | 46/46 independently replayed, eight independent negatives and three detected mutants. Unchanged strict proof also passes actual SDK/scanner/SQLite review: only explicit removed=false admits JOE. Watcher persisted restart and Service process removed/missing-flag refusals pass | Changed-test convention, producer export and affected independent receipt proof are closed; ordinary released-graph qualification follows publication |
| Chain and provider methods; RCS-003 Rosen Chain and Abstract Chain Network | Explicit requirement | AVAX and ERC20 payment, reads, signing, submission, recovery and management | Guard `packages/chains/avalanche`, `packages/networks/avalanche-rpc` and service cold job | Chain/factory tests, immutable Transfer proof through DAO completion/recovery, actual cold producer/admission | Current full Avalanche chain passes 711 cases; unchanged RPC 347 and factory 91 remain scoped evidence. Payment/recovery 446, admission/verifiers 102, canonical cold class 34 and current PostgreSQL management 161 pass. Independent GM2/GM4 review detects three mutants. Full Guard types and focused lint pass; counts overlap | Final Guard13 source export, independent selected-source review and configured Avalanche startup/cache/API joins are closed. Ordinary registry/full-job acceptance remains separate |
| Treasury health; RCS-003 Health Check and Asset Check | Explicit requirement | Native gas and admitted token balances | `health-check/packages/asset-check/lib/avalanche`; Guard/Watcher registrations | Finalized balance, thresholds, identity failures and actual normal dispatcher | Scanner59/Guard18 plus four independent controls pass; five mutants detected. Final configured Guard reports AVAX/JOE/scanner Healthy in four normal/sequential cycles. Earlier56/90 suites remain scoped. Deadline covers queue plus qualified read; exclusive actions remain protected | Operators: final thresholds, addresses and endpoint acceptance. Whole Guard/TSS health is not established |
| Watcher registration; RCS-003 Watcher Service | Explicit requirement | Mainnet scanner, observation and sync health; Fuji optional | Watcher config/types/scanner jobs/health and secret environment mapping | Enabled/disabled configuration, readiness, token observation, restart and legacy-chain regressions | Ten source-owned author and independent cases cover actual loaders/factory/persistence. Portable declared npm-start replay passes first start/restart with identical JOE observation and two receipt refusals, 44 real migrations and qualified mainnet frontier. Read-only receipt/SQLite review passes. Unrelated jobs and fee/Ergo initialization are isolated | Source/release composition and token-health preparation are closed. Ordinary installed graph follows releases; full-job and operating acceptance remain distinct |
| Guard registration; RCS-003 Guard Service | Explicit requirement | Config/address/confirmation policy, health, extractors, chain factory, references and balance iteration (9999 unless endpoint limits justify another value) | `services/guard-service/src` and `tsconfig.json`; environment mappings | Actual config reader, migrations, index, serialized readers, API and health dispatch | Routes173 plus17 root/nine independent descriptor controls pass. Final870-file source starts migrations, index, API, libp2p and TSS transport. Actual GuardNFT/nine fee readers decode fixtures; PostgreSQL balance producer/cache/API/browser join passes. Four health cycles pass; eight owned ports released | Rosen/operators: final values/contracts/shares and operating acceptance; ordinary release-selected installation remains pending |
| UI base registration; RCS-003 UI Icons, Constants, Utils, Network Bases and Rosen App | Explicit requirement | Avalanche identifiers, URLs, App network and selected token routes | `ui/packages/{icons,constants,utils}`, `ui/networks/avalanche`, App Avalanche actions/hooks | Network/App token selection and exact conversion/generation; normal build and browser checks | Ownership correction and independent compiled comparison pass. Exact separated UI series preserves both pinned bases and upstream deltas. Current existing-form browser on tree 9b84ceda4585b5d4985b1c38697ded20e44f777f preserves JOE calldata/amount and refuses low AVAX/wrong wallet network using synthetic transport | Guard balance caller and six-group UI export are closed. Contributor: ordinary build after releases and dashboard token-link connection after Rosen supplies its component port |
| UI integration order; RCS-003 UI | Convention and specified integration guidance | Base data changes grouped together; calculator before Service consumer configuration | Icons/constants/URLs/network/App base group, then calculator/Service/network/wallet | Rebuild dependent producers and inspect the proposed commit groups | Final P01/P02/P03/G01/G02/C01 six-group export applies exactly, grouping base registrations and keeping generic interfaces/statistics/EVM bounds separate. Full42-package/86-note version rehearsal and corrected Service7.2 floor are included; optional prototype excluded | Rosen: review contribution order and approved releases; ordinary locks/install follow publication |
| Network package behavior; RCS-003 UI Network Package | Explicit requirement | Height, fee, min/max transfer and lock generation for each admitted asset | `ui/networks/avalanche/src/{client,getMaxTransfer,tokenPolicy,utils}.ts` | Token cap, exact raw conversion and transaction binding; separate AVAX gas failures | Network owns conversion/calldata and separate AVAX gas. Independent compiled comparison preserves native/token behavior. Current browser binds one unsigned JOE amount/calldata on 43114, refuses low AVAX/wallet 43113 with zero sends; actual server action refuses provider chain 1 | Contributor: ordinary released-graph qualification; live signing/broadcast and operational activation remain outside local validation |
| Calculator and Rosen Service; RCS-003 UI Asset Calculator and Rosen Service | Explicit requirement | Token balances and scanner/observation/event/health/config consumers | `ui/packages/asset-calculator`, `ui/apps/rosen-service` | Finalized ERC20 balance/supply; real stored locked amounts and wrapped emission; refusal without unsafe overwrite | Calculator61/Service105 and six author/six independent PostgreSQL joins remain scoped. Portable successor has11 source files, five passing actual mainnet AVAX/JOE PostgreSQL/Service phases and38 stopped captured identities. Holds, wrong chain and the scanner-update mutant refuse before calculator reads. Cleanup has3 source-owned/8 independent mocked controls; exact application and publication guard pass. Other chain starts are isolated and private installed overlays are used | Contributor: preserve the portable process export and qualify ordinary installation after producer release; no whole-Service or atomic OS process ownership claim |
| Rosen contract/token integration; RCS-003 Contracts | Explicit requirement; minting assigned to Rosen | Each bridge asset wrapped on Ergo; chain config and existing global identities | `contract/src/main/scala/rosen/bridge/AvalanchePreparation.scala`; assigned-value template | `AvalanchePreparationSpec`; offline compile of ten unchanged scripts; duplicate JSON/identity refusals | Five-path source export applies to baseline4302d8d34020b0012c3fcb25d7484aa602813cab. Preparation22 plus merge40 pass offline on the exact fresh export with Test/parallelExecution=false. Initial concurrent61/62 failure remains recorded; ten baseline scripts unchanged | Preparation complete. Rosen: actual identities, mint/deploy and key ceremony; contributor: run parameterized acceptance on supplied values |
| Preserve existing deployment configuration; RCS-003 Contracts plus existing contract format | Contributor inference from deployment preservation | Append Avalanche without replacing current chains/assets/global IDs/versions | `contract/src/main/scala/rosen/bridge/AvalancheOverlayMerge.scala` | `AvalancheOverlayMergeSpec`; actual merged map through configured consumers; collision/version refusals | Independent CM1 review and fresh62-case export replay pass; mixed-case collisions refuse before output. Valid global identity reuse and positive map/contracts bytes remain unchanged. Current Watcher/Service/Guard use complete merged fixtures | Rosen: assigned deployment identities; contributor: execute prepared generation/merge/consumer acceptance when supplied |
| Package creation, placement and versions; RCS-002 Kodegen and RCS-003 Integration Notes/modules | Explicit requirement and convention | New chain/RPC/UI packages; existing EVM package reuse | Kodegen scaffold; new package 0.0.0; initialization changeset; no manual version bump | Authentic unscoped Changesets plans, source/package build and clean consumer installs | New0.0.0 packages and initialization changesets, current producer/consumer floors and exact portable applications are included. Normal Changesets previews preserve baseline notes. Structural package placement and contribution split remain proposed | Rosen: accept structural deviations and publish approved producers; contributor: ordinary released-graph locks/install/build after publication |
| Changesets and release levels; RCS-002 Changesets and RCS-003 Integration Notes | Explicit requirement and convention | Every contribution; backend Guard integration major; other levels follow applicable clause | Repository Changesets and prepared release sequence | Complete plans preserve pending notes; released tarball/SRI and ordinary installation follow publication | Producer health complete/sequential plans pass17 entries/14 version changes; extractor7.2/scanner2.1/abstract4.0.1/raw0.3. UI42 packages/86 notes computes Utils1.2/Avalanche0.1/GuardApp4.5.3. Guard13 combined plan computes Guard12/Ergo15.1/network10.0.6. Watcher7 and Fee1.4/1.1 previews preserved | Maintainers: decide separate release sequence and publish. Contributor: regenerate ordinary locks/install/build; changed sequential baselines require a fresh plan |
| TypeScript test structure and documentation; RCS-001 Structure, Test Document and Implementation | Explicit requirement | Changed TypeScript unit tests; supplemental joins separately classified; Scala layout N/A | Actual class/function groups, four-part targets, data/utils/mocks/setup and value equality | Exact changed-input audit and declared collection | Guard census84 specs/1,426 declarations/1,352 added has zero missing tags and no added target/title misses;54 unchanged baseline declarations lack literal title inclusion. All95 fallback targets checked. Collection52 changed files expands3,161 cases. Independent review preserves callbacks/mocks/fixtures; scoped529 controls pass. Watcher116, Fee1,176 and UI60/component10/helper4 retained | Changed-input closure locally validated; no repository-wide convention or complete executed-suite claim |
| JSDoc, arrows, tooling and logging; RCS-002 | Convention and explicit contribution guidance | Changed functions and consumers; preserve documented dispatch exceptions | Source documentation; Node22.18.0/npm11.6.2 TS runtime; contract uses Java8/Scala2.12.7/AppKit5.0.0 | Focused lint/format/type/build, secrets-free diagnostics and declared runtime checks | Guard76 quality paths and three startup-import type stages pass;59 production executable comparisons have no unresolved drift. Changed function documentation, fixture placement and UI helper ownership closed. Native inherited hooks and Next page exception remain scoped | Locally validated; ordinary released-graph build/CI follows approved producer publication |
| API consistency across providers; RCS-003 new-network Rosen Extractor | Explicit requirement when adding another API | One RPC API with multiple endpoints; a second explorer implementation is currently N/A | Same signed transaction/block/receipt semantics across selected endpoints | Deterministic endpoint disagreement/history and exact extracted data joins | One RPC API implementation supports multiple endpoints. Deterministic extracted-field, chain-ID and history/conflict checks pass; parameterized profiles do not prove independent production availability | Operators: provide selected endpoints and execute prepared semantics/history acceptance; a future API addition requires the same consistency checks |
| Node resources and confirmation details; RCS-003 Requirements technical information | Recommendation; operating evidence still required | Mainnet operating deployment | Operator guide, finalized policy and node/receipt/history inspection | Selected infrastructure retention/capacity/cleanup acceptance | Parameterized inspection and release/deployment acceptance procedure are supplied. Synthetic source checks establish their refusal boundaries, not production capacity, retention or cleanup behavior | Operators: qualify selected infrastructure, receipt/history retention, rate/batch limits and cleanup/confirmation policy using the supplied procedure |
| Shared prerequisites and submission; RCS-002/003 conventions plus current sibling diffs | Convention and contributor inference | Generic signing/database changes overlap existing chain series | Dependency groups and API comparisons below | Exact selected diffs, matrix, public guards and clean-clone export | Producer health8, bounded4, Watcher4, Service1, Fee4, UI6, Guard13 and contract1 have portable exact applications. Guard independent source review has no blocking findings. Equivalent rewrites/prototypes excluded; release sequencing proposed, not accepted | Contributor: retain exact publication checks and changed-input evidence at delivery. Rosen: document/split/API review and production activation decisions. Fork publication alone does not establish upstream submission or release |

## Current validation and contributor work

The current portable series cover producers, bounded reads, Watcher, Service,
Guard shared prerequisites and Avalanche wiring, Fee, UI and contract preparation.
The [Guard series](../contribution/guard-chain-series-20261005/README.md) has13
dependency-ordered groups, including a separate signing-consumer prerequisite.
All applications and the three startup-import type checks pass. Independent
review checks293 selected outputs and59 production executable comparisons;
scoped runtime evidence covers529 controls. Collection expands3,161 cases
across52 changed files, which is collection evidence rather than execution.
The [focused Guard replay](../contribution/guard-runtime-replay-20261005/README.md)
runs six affected source-owned suites on the applied final tree and passes
147/147, exit0. Its launcher, input pins and validated result are included;
it selects the service configuration and uses a private cache. These cases
overlap the retained scoped controls and use the prepared dependency graph.

The exact final configured Guard starts migrations, serialized readers, API,
libp2p and TSS transport. Four normal/sequential cycles report AVAX, JOE and
scanner Healthy. Its cache/API reaches the built UI through a read-only local
bridge. This establishes the stated Avalanche join, with synthetic transports;
other chain jobs and genuine TSS shares remain outside that result.

Normal registry installation still follows producer publication. Rosen review
of this document, the proposed package placement and dependency split, the
dashboard token-link contract and the historical native example chronology
remain open. Final identities, minted tokens, contracts, keys and operating
infrastructure also require Rosen/operator inputs. The linked procedures prepare
their generation, validation, release order and acceptance checks.

Historical native results still support unchanged branches: native management
producer checks passed 588 cases, with 40 independent compiled controls and six
detected mutations. The final native API/PostgreSQL profile passed 528 API tests,
eight PostgreSQL cases, five setup refusals, two restart phases and six signing
controls. The fee application's declared selectors covered 1,165 cases.
These are source-specific native results, not ERC20 reruns or mainnet deployment
qualification. The linked validation document carries their detailed input scopes.

Shared database evidence includes actual SQLite ownership/bootstrap, Service
registration and statistics queries against the selected constructor families,
and real PostgreSQL startup/restart checks. A token change to a map, package
family, callback or persistence input must rerun its affected downstream checks.
Passing source tests does not establish that a future registry graph installs.

## Mainnet JOE lock examples

The frozen examples use C-Chain ID `43114`, the official JOE token address,
synthetic custody and a synthetic Ergo counterpart
`6666666666666666666666666666666666666666666666666666666666666666`
(`J` below). This example counterpart has eight decimals. The separate
contract-generated overlay uses nine counterpart decimals and was consumed by
the actual Tokens 6.0.2/UI conversion path; those fixtures must not be conflated.
Neither fixture assigns a deployed counterpart or custody address.

| Rosen request field | JOE to Ergo | Ergo to JOE |
| --- | --- | --- |
| `toChain` | `ergo` | `avalanche` |
| `toAddress` | `9iMjQx8PzwBKXRvsFUJFJAPoy31znfEeBUGz8DRkcnJX4rJYjVd` | `0x1111111111111111111111111111111111111111` |
| `bridgeFee` | `2` | `2` |
| `networkFee` | `3` | `3` |
| `fromAddress` | `0x8c5c59c57b660b323ec5e9b48fdb95a99fde84ce` | Ergo fixture lock address `L` in the native reference below |
| `sourceChainTokenId` | JOE contract address | `J` |
| `amount` | `10` | `100` |
| `targetChainTokenId` | `J` | JOE contract address |
| `sourceTxId` | `0x43bde42f26f289ce7eb35f116adcb32c4efd967f1e46ef64d1b660e26d5f7513` | `7777777777777777777777777777777777777777777777777777777777777777` |

The outbound call has zero native value and transfers `100000000000` raw JOE
units to synthetic custody `0x1111111111111111111111111111111111111111`.
The EVM envelope uses chain ID `0xa86a`; AVAX pays its gas. Its calldata is:

```text
0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000174876e80000000000000000000200000000000000032103f999da8e6e42660e4464d17d29e63bc006734a6710a24eb489b466323d3a9339
```

The return box carries `100` units of `J`, targets `avalanche` in R4 and
decodes to the same JOE contract. Its box ID is
`efa414803f7a9f446932de8f08c1c3a15a3e7253a10abf9fd93b8f8be4a9f672`.
Both generic EVM extractors and the Ergo producer/extractor preserve all nine
fields. The source-owned ERC20 replay below passes those joins and six isolated
refusals; a separate actual Watcher/Service replay closes persistence and restart
at the documented scope. The Avalanche observation class spec supplies the
additional receipt Transfer proof and its refusal cases.

From a candidate UI workspace whose producers and declared dependencies have
been prepared, select the matching Utils source tree explicitly:

```shell
node --import tsx ../operation/scripts/verify-avalanche-erc20-lock-examples.mjs --ui-root . --utils-root ../utils
```

The script uses its adjacent `avalancheErc20LockTestData.json`, the actual
Avalanche network/App action, both EVM extractors, and the Ergo producer/extractor.
It performs six in-memory chain-ID reads and no signing, broadcast or listening
server. The frozen example has eight counterpart decimals; the generated
consumer configuration has nine. Each conversion is checked against its own map.
Generic metadata extraction alone does not establish receipt inclusion.

## Native AVAX reference examples

These native-only fixtures remain a bounded regression reference for unchanged
producers. Their Fuji network and earlier validation do not establish the new
mainnet ERC20 route.

These deterministic Fuji fixtures use the actual App lock producer, both EVM
Rosen extractors and the Ergo lock-box producer/extractor. They are synthetic
transactions; they have no live transaction links. Fixed signature components
provide a decodable EVM envelope without a signing key or broadcast.

The counterpart token is
`5555555555555555555555555555555555555555555555555555555555555555`
(`T` below), with eight decimals; native AVAX has eighteen. The Ergo fixture
lock address (`L`) is
`2CBjjwbY9Rokj7Ue9qT2pbMR2WhLDmdcL2V9pRgCEEMks9QRXiQ7K73wNANLAczY1XLimkNBu6Nt3hW1zACrk4zQxu`.
The addresses, token, fees and destination index `100` in the script are test
inputs, not Rosen deployment assignments.

| Rosen request field  | Avalanche to Ergo                                                    | Ergo to Avalanche                                                  |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `toChain`            | `ergo`                                                               | `avalanche`                                                        |
| `toAddress`          | `9iMjQx8PzwBKXRvsFUJFJAPoy31znfEeBUGz8DRkcnJX4rJYjVd`                | `0x1111111111111111111111111111111111111111`                       |
| `bridgeFee`          | `2`                                                                  | `2`                                                                |
| `networkFee`         | `3`                                                                  | `3`                                                                |
| `fromAddress`        | `0xb17e6e94af1f3baa1521a0abd98b2a52bb5fb3bb`                         | `L`                                                                |
| `sourceChainTokenId` | `avax`                                                               | `T`                                                                |
| `amount`             | `10`                                                                 | `100`                                                              |
| `targetChainTokenId` | `T`                                                                  | `avax`                                                             |
| `sourceTxId`         | `0x2b356a599965142e9c9dc2f86877979c1fb242cfbca4001ded29da15aa87db5f` | `6666666666666666666666666666666666666666666666666666666666666666` |

The outbound transaction locks `100000000000` wei at the fixture EVM lock
address. The extractor normalizes that value to `10` units of the eight-decimal
counterpart. Its calldata, without the `0x` prefix, is:

```text
00000000000000000200000000000000032103f999da8e6e42660e4464d17d29e63bc006734a6710a24eb489b466323d3a9339
```

The return box has ID
`227ffb6e4c94324a6604b6ca96c92841a526ede3d08fba647b1a6e3dec758338`.
R4 encodes the five strings `[avalanche, 0x1111111111111111111111111111111111111111,
3, 2, L]`:

```text
1a05096176616c616e6368652a307831313131313131313131313131313131313131313131313131313131313131313131313131313131013301325a3243426a6a77625939526f6b6a3755653971543270624d523257684c446d64634c3256397052674345454d6b73395152586951374b3733774e414e4c41637a5931584c696d6b4e4275364e74336857317a4143726b347a517875
```

With UI and Utils dependencies installed and their consumed workspace producers
built, run from `ui` using Node 22.18.0 or newer:

```shell
node --import tsx ../operation/scripts/verify-avalanche-lock-examples.mjs --ui-root . --utils-root ../utils
```

The command prints the full envelope, R4, decoded requests and eleven isolated
refusals covering token, custody, metadata and chain identity. It uses a Vite
source loader from the UI's declared Vitest dependency tree, with no listening
server, and permits only two in-memory `eth_chainId` reads. This replay validates
the source joins; it does not replace installed-release or live-chain checks.

## Reproducing token module checks

Use Node 22.18.0/npm 11.6.2 for the TypeScript workspaces and build the consumed
workspace producers first. From the EVM observation extractor package:

```shell
npm run test -- --run tests/avalancheRpcObservationExtractor.spec.ts
npm run type-check
```

From `ui/networks/avalanche`:

```shell
node ../../scripts/run-vitest.mjs run --maxWorkers=2 --minWorkers=1
```

From `ui/apps/rosen`:

```shell
node ../../scripts/run-vitest.mjs run --config vitest.avalanche.config.ts --maxWorkers=2 --minWorkers=1
```

The network/App selectors include the new token-policy, conversion and selected
asset action cases. They do not substitute for wallet, installed Service or
browser acceptance. The wallet has its own declared tests in
`ui/wallets/metamask`; its110 author cases are supplemented by the independent
package-ownership and compiled-behavior comparison, including43 provider requests
and two synthetic sends. Real extension acceptance remains separate.

The contract workspace uses Java 8, Scala 2.12.7 and AppKit 5.0.0. From `contract`:

```shell
sbt "set Test / parallelExecution := false" "testOnly contracts.AvalanchePreparationSpec contracts.AvalancheOverlayMergeSpec"
```

The preparation procedure supplies the exact generation and merge commands,
`operation/config/avalanche-contract-preparation.template.json`, and the
synthetic assigned-value example at
`contract/src/test/resources/avalanche/assigned-values.example.json`.
These are offline generator inputs; they do not authorize minting or deployment.

## Reproducing the fee application checks

The current installed fixture route covers AVAX and ERC20 consumers and passes
1,176 tests in33 files through15 jobs. Its four-group source series and the
independent fixture corrections are linked in the validation guide. Older
native-only results remain historical evidence.

The fee repository's `docs/avalanche-tests.md` provides the fixture contract and
setup command. Its `scripts/prepare-avalanche-fixtures.mjs` builds and packs the
candidate database bootstrap, obtains three integrity-pinned producer archives,
installs the exact direct dependency versions into a new directory and emits
the eight-variable environment. Use `--run` to execute the public test target
and its independent fixture preflight. Retain the generated lockfile, archives
and receipt for subsequent dependency replay.

## Reproducing the native management consumer

These selectors exercise native management. Earlier passing results retain
their recorded source pins; token changes require affected reruns.

Use the repository's Node and npm versions. Build the local chain/RPC producers
and their workspace dependencies before running Guard tests; the Guard must
resolve those outputs consistently rather than mixing constructor families.
From `guard-service/services/guard-service`, the focused commands are:

```shell
npm run test -- --run tests/verification/avalancheManagementAuthorization.spec.ts tests/verification/avalancheManagementDependencies.spec.ts
npm run test -- --run tests/verification/avalancheManagementExecutionAuthorization.spec.ts
npm run test -- --run tests/signing/avalancheManagementSigning.spec.ts tests/signing/avalancheManagementPersistence.spec.ts tests/transaction/avalancheManagementProcessor.spec.ts
npm run type-check
```

These fixtures use public synthetic keys and transactions, real SQLite, the
Guard runtime and a loopback HTTP peer. They authorize no public network
broadcast. The consumer checks initial and repeated submission, reconciliation
without another POST, exact signed recovery, completion, derived invalidation,
scanner holds and SQL rollback. Submission authority covers the synchronous
transport start; the result obtains fresh scanner and persistence authority.

The public SQL fixtures cover SQLite. The dedicated PostgreSQL configuration
replays execution and processor consumers against the Guard's actual PostgreSQL
migrations, with no schema synchronization. Its nineteen fixture entities
include Permit and Collateral; this is not a complete production startup test.
The final independent profile replays 528 API tests, 8 PostgreSQL cases, five
setup refusals, two fresh-process restart phases and six public PostgreSQL
signing controls against the final producer. Its standard selector contains
103 files and the PostgreSQL selector contains 4, with the PostgreSQL-only
specifications excluded from the default profile.

From the same service directory, select an empty dedicated local database named
`avalanche_native_fixture`. The setup accepts only a PostgreSQL URL on localhost
or `127.0.0.1` with an explicit port; it truncates fixture tables between cases.
Supply its URL through `AVALANCHE_NATIVE_FIXTURE_DATABASE_URL`, then run:

```shell
npm run test -- --run --config vitest.native-management-postgres.config.mts tests/verification/avalancheManagementExecutionAuthorization.spec.ts tests/transaction/avalancheManagementProcessor.spec.ts
```

For restart acceptance, set `AVALANCHE_NATIVE_FIXTURE_RESTART_PHASE=seed` and
`AVALANCHE_NATIVE_FIXTURE_RESTART_SNAPSHOT` to a new writable snapshot path. Run
only `tests/db/avalancheNativeManagementPostgresRestart.spec.ts` with that
configuration. Stop and restart the database server using the same cluster;
then repeat the test in a fresh process with phase `replay` and the same snapshot
path. Replay checks unchanged persisted records, the signed native envelope and
an empty pending migration set. It does not clear the seeded database.

The detailed [validation snapshots](avalanche-validation-evidence.md) retain
their source-specific limits. A portable export must bind its own exact source
inventory, patches and replay results after the source documents are final.
Its manifest and receipts accompany the export separately.

## Shared contributions and dependency order

Shared work needs an explicit review boundary before the integration series is
submitted. The following split is proposed; it is not a settled upstream series.

| Contribution                                | Reusable invariant                                                                                                     | Avalanche consumer and release order                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Generic TSS admission                       | Pending capacity, deadline, key identity and once-only authorized phases survive asynchronous work                     | Release the signing producer before the Guard signing consumer                                   |
| Shared scanner/storage compatibility        | Persisted safety and registered entity constructors remain consistent across supported database consumers              | Scanner, extractor and storage producers precede Watcher/Guard/Service consumers                 |
| Shared statistics/data-source compatibility | Queries resolve the constructors registered by the selected data source                                                | Data-source/statistics packages precede App and Service consumers                                |
| Avalanche chain/provider             | Explicit C-Chain identity, AVAX gas reserve, mapped asset identity and settled execution are preserved across generation, signing and execution | Chain/RPC packages precede Guard, calculator and UI network consumers                            |
| Avalanche service and wallet registrations  | The same amount, asset, destination and event identity survive the full route                                          | Integrate after compatible producer releases; update public lockfiles against registry integrity |

The earlier accepted Bitcoin provider and transaction-ID recovery changes,
Doge input reservation, and Binance EVM subclass/observation wrapper support
these interface and lifecycle comparisons. The reference commits are
[Bitcoin provider](https://github.com/rosen-bridge/guard-service/commit/1afb500f60669b5eeb0f399a755a9f4d7ae9bdd4),
[transaction-ID recovery](https://github.com/rosen-bridge/guard-service/commit/88b86ef61bc620688d6dd677ba4d460786e8d2f6),
[Doge reservation](https://github.com/rosen-bridge/guard-service/commit/efa1a4ca3fb2f4078a9ed067ec3da44dfc9ea6bf),
[Binance chain](https://github.com/rosen-bridge/guard-service/commit/12c736c0f93d3884d204017e244750e854787c62)
and [observation wrapper](https://github.com/rosen-bridge/scanner/commit/6efd277e5f4a48b2f791c0a4a8546ed4fb21db6d).
They belong to upstream history and may predate current RCS conventions.
They do not establish approval of this candidate.

## Shared signing contract and deployment inputs

The candidate retains action-based transport authorization: the actual
transport callback starts inside retained authority, can run at most once and
expires when its gate returns. Transport completion is awaited outside the
gate. The Ergo consumer binds `signingAuthorization` and uses phase-specific
`withAction`. Legacy four-argument behavior remains part of the compatibility
surface.

The following public proposals were compared on 2026-10-03:

| Proposal | Fifth `Communicator.sendMessage` argument | Submission boundary |
| --- | --- | --- |
| [sign-protocols #2](https://github.com/rosen-bridge/sign-protocols/pull/2), head `4a97dc96f4ad404961e0e3317503f0c457089054` | `beforeSubmit?: () => undefined` | Synchronous assertion after envelope serialization, before transport |
| [sign-protocols #3](https://github.com/rosen-bridge/sign-protocols/pull/3), head `ba67703f3ab91550d8a68da271a6e170df86c472` | `gate?: { authorize: () => Promise<void>; assertCurrent: () => void }` | Authorization followed by currentness assertion and awaited transport |
| Avalanche candidate | `authorizeSubmit?: (submit: () => void) => Promise<void>` | At-most-once synchronous callback during the gate; completion awaited outside |

The contributor must preserve retained authority and qualify any shared
adaptation against real dispatch consumers. PR #3 additionally copies payload
and peers before asynchronous signing; the current candidate does not provide
that same snapshot guarantee. Matching type or version numbers do not establish
compatibility. Upstream review owns acceptance and the public contribution
boundary; useful local implementation and validation remain contributor work.
[sign-protocols #9](https://github.com/rosen-bridge/sign-protocols/pull/9) changes
separate Go reservation paths and does not settle this TypeScript contract.

Mainnet `43114` is the primary candidate profile. Production destination-byte
allocation, minted global/chain/counterpart/NFT identities, deployed custody
and contracts, and genuine ceremony outputs must come from Rosen.
Operators supply the approved endpoint inventory, retained-history/start-height
and fee/confirmation policy. The contributor owns the templates, generation and
merge interfaces, deterministic fixtures, local mainnet simulation, database
and configuration checks, release sequence and acceptance commands before those
late values arrive.

The deployed cleanup rule must be checked alongside finalized C-Chain evidence.
A held scanner or rejected event does not cancel an Ergo cleanup transaction.
After approved producer releases, the contributor verifies actual registry
versions, tarball and integrity values, regenerates consumer locks with npm and
reruns clean installation and affected consumer checks. Maintainer release
outputs do not transfer those tasks to Rosen.
