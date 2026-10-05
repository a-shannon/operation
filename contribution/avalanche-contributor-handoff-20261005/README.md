# Avalanche contributor source handoff

Select the repositories below from the final source series. Apply each series
to its own fresh scratch root using its existing verifier; source application
does not install packages or activate services. Full manifest hashes, input
trees, group order and commands are in [source-map.json](source-map.json).
RCS revision `7b9784dae9d8d5b66b80de7a6043d1ba36a3a4bf` is the requirements
baseline. Rosen has not accepted the proposed contribution boundaries.

| Repository | Baseline commit | Selected final tree | Series and order |
|---|---|---|---|
| sign-protocols | 243f5882e6c589f8e1fc16b5887d0a1162fbf89c | 1658a9e4b648bea9c26d80cf3420b08ade514f01 | producer-health: S01 → S02 |
| utils | 28e3bd960d10b662eef3c05c29e11e0acb9372ae | 0b8395cd457768879a48681e3213f2dc1fb04742 | producer-health: U01 → C-UTILS |
| scanner | 8f3a4e35c0dab5763a0f89a9903357261e5e55a5 | bd4f7837a5c5c480019a5c0c4b0295153f8738db | producer-health: SC01 → SC02 → SC03 → C-SCANNER |
| health-check | 8612db85d00db32651a5fbaa9bde7dd075a651e3 | b3e3886498c597ebb7214e16e44c4a21d8aa7d4f | bounded: retain C-HEALTH only |
| guard-service | b1f5ab6f81435053a979e8078eb098d8ec1f5a47 | 68496f6b1bad18617d16bc4a3d3032c78dd3fa33 | guard-chain: generic8 → G01 → G07 → C-GUARD-SOURCE → G04-CONSUMERS → C-GUARD-WIRING |
| ui, including Rosen Service runtime | d62818e0c5e3e3452454f07def81059b14c784f9 | 4579ad9756d12ee08596352910fe124c9a5d9636 | ui-complete: P01 → P02 → P03 → G01 → G02 → C01 |
| watcher | 4552b29b95dd48947f85406857641b1ecb2e5490 | a61591623580b0a358afd83ac18cf146e17b4188 | watcher: W03 → W01 → W02 → C-WATCHER |
| minimum-fee-job | de706245e439506ef55697b64caf6605cadf5171 | 6312b8ab91defcab07f0869a0d8b3a0fc47a7967 | fee-installed: F01 → F02 → C-FEE → C-FEE-UI |
| contract | 4302d8d34020b0012c3fcb25d7484aa602813cab | b7a81f0408026c99e4a3a520e01c4150ccb56421 | contract-source: C-CONTRACT |
| operation replay kit | f0634e155bc83db7477a0a54a42cf70bc9b83b63 | fcec80f7be5bc25372686dbc616cf1dfcb046b22 | service: C-SERVICE-REPLAY |

Run from the integration root. `<repository-parent>` contains the repositories
named by each manifest at the listed commits. Every scratch directory must be
absent, have an existing parent, and sit outside the source repositories.

```text
node operation/contribution/producer-health-series-20261005/verify.mjs <repository-parent> <fresh-producers>
node operation/contribution/bounded-series-20261005/verify.mjs <repository-parent> <fresh-bounded>
node operation/contribution/guard-chain-series-20261005/verify.mjs <repository-parent> <fresh-guard>
node operation/contribution/ui-complete-series-20261005/verify.mjs <repository-parent> <fresh-ui>
node operation/contribution/watcher-series-20261005/verify.mjs <repository-parent> <fresh-watcher>
node operation/contribution/fee-series-installed-20261005/verify.mjs <repository-parent> <fresh-fee>
node operation/contribution/contract-source-series-20261005/verify.mjs <repository-parent> <fresh-contract>
node operation/contribution/service-series-20261005/verify.mjs <repository-parent> <fresh-service-replay>
```

The bounded verifier applies all four groups; it has no selection flag. Retain
only its health-check result. Its Guard G01/G07 inventories already occur in
the final 13-stage Guard series, rebased after the generic eight. Its contract
result is superseded by the final five-path contract-source series. Keep these
applications separate. Earlier producer, generic Guard, UI, Fee, contract and
native-only drafts are historical evidence; stacking them on the selected
final repositories would duplicate or replace reviewed changes.

UI6 owns the Service runtime. Service1 contributes eleven Operation replay
files and complements that runtime; it is not another Service source patch.
Sixteen intersecting runtime/configuration pins match exactly. The sole
package difference is the selected extractor floor 7.2.0 versus the preserved
prepared-process graph labelled 7.1.0. Retain that process evidence at its
actual scope; it does not qualify ordinary installation of the selected floor.

Resolve producer releases before normal consumer installation. Rehearse the
full pending Changesets plan, preserve unrelated notes, then resolve the
ordinary lock and run the applicable clean install/package/consumer builds.
The recorded October5 checks returned404 for exact extractor7.2.0,
scanner2.1.0 and AvalancheRPC0.1.0. Cached source graphs and local build results
do not close that release gate.

The [dashboard token explorer proposal](../avalanche-token-explorer-port-20261005/proposal.md)
remains open: ui-kit6.1.0 has no per-token href or deployment input. Rosen must
choose the shared input contract and supply its component implementation and
release. The preferred proposal adds an optional token item href while keeping
the card's “See All” href independent. After that decision, join the dashboard
to the validated network data and run the focused component, browser and
ordinary build checks. Existing `/assets` links and URL-producer fixtures do
not close the dashboard identifier-link requirement.

Use [the integration matrix](../../docs/avalanche-rcs-integration.md),
[operator procedure](../../docs/avalanche-c-chain.md) and
[contract preparation guide](../../docs/avalanche-contract-preparation.md)
for validation and acceptance. Actual Rosen IDs, custody ceremony, production
parameters, endpoint acceptance and authorized minting/deployment remain
external. Public submission and any signing, broadcast, deployment or funds
operation require their separate authorization and exact promotion checks.
