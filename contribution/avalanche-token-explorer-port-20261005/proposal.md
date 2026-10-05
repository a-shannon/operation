# Token explorer input for TokensCard

Proposal status: awaiting Rosen UI agreement and a supplied component release.

`TokensCard` displays token identifiers through `TokensList`, but ui-kit 6.1.0 exposes no per-token explorer URL or deployment ID. Its `href` prop controls the card's “See All” action. The identifier uses `getTokenUrl(chain, tokenId)`, whose Avalanche entry currently returns no URL. The same `avalanche` chain key represents C-Chain mainnet and Fuji, so it cannot determine the explorer by itself.

The existing Avalanche network balance decoder already validates deployment 43114 or 43113 and produces `tokenUrl` for mapped tokens. Native AVAX has no token-contract URL. The `/assets` page uses that decoder; the dashboard TokensCard caller instead uses the generic balance hook and merges hot/cold balances without forwarding explorer metadata. Supplying the component port therefore also requires a thin dashboard data join to the validated network producer. A component prop alone does not close that join.

## Preferred alternative: explicit href on each token

Extend the existing `tokens` item type in both `TokensCardOwnProps` and `TokensListOwnProps`:

```typescript
tokens: Array<TokenInfoWithColdAmount & { href?: string }>;
```

Keep the card-level `href` and the shared API `TokenInfo` type unchanged. Forward token items from Card to List without dropping the optional field. The proposed identifier resolution is:

```typescript
token.isNativeToken
  ? undefined
  : token.href ?? getTokenUrl(chain, token.tokenId)
```

The network package owns deployment validation and URL construction. The app maps an already validated `tokenUrl` to the optional item `href`; the shared component renders that value through its existing `Identifier`. Existing callers that omit the new field retain their current behavior. This alternative adds no chain-specific branch to Card or List and preserves the native-token rule, amounts, decimals, hot/cold labels, loading state and card layout.

For the dashboard join, use the validated Avalanche balance reader rather than deriving an explorer from the chain name or a default environment. Preserve the existing first-five token selection and hot/cold merging. Incompatible deployment or token identity must remain an explicit data error or leave the identifier unlinked; it must not select mainnet implicitly.

## Alternative: explicit chainId forwarded to the URL helper

Add optional `chainId?: number` to Card and List, forward it through Card, and extend the existing helper signature:

```typescript
getTokenUrl(network?: Network, tokenId?: string, chainId?: number): string | undefined;
```

List retains its native-token guard and delegates non-native URLs to that helper. The helper uses the existing Avalanche explorer selector: 43114 selects mainnet, 43113 selects Fuji, and missing or unsupported IDs yield no URL. Existing non-Avalanche helper outputs remain unchanged. This alternative changes both the generic component input and the shared URL helper; the dashboard must still supply a deployment validated by the network producer. It must not infer an EVM chain ID from the generic `Network` key.

The explicit-href alternative reuses the URL already available from the network decoder and has the smaller shared contract. Rosen should choose the accepted field and contract before either alternative is implemented.

## Expected link fixtures

All contract identifiers below are synthetic. The URLs follow the current explorer-selector source.

| Case | Deployment | Identifier | Expected token href |
| --- | --- | --- | --- |
| Mapped token, mainnet | 43114 | `0x1111111111111111111111111111111111111111` | `https://snowtrace.io/token/0x1111111111111111111111111111111111111111` |
| Mapped token, Fuji | 43113 | same identifier | `https://testnet.snowtrace.io/token/0x1111111111111111111111111111111111111111` |
| Missing deployment | absent | same identifier | absent; existing network decoder rejects the response |
| Unsupported deployment | 1 | same identifier | absent; existing network decoder rejects the response |
| Native AVAX | 43114 or 43113 | `avax` | absent, including when an explicit token href is supplied |
| Missing/malformed token | 43114 | empty or `token/invalid` | absent; existing network decoder rejects the row |
| Existing Ethereum caller | unchanged | synthetic contract above | `https://etherscan.io/token/0x1111111111111111111111111111111111111111` |

`fixtures.json` contains the exact inputs and expected outcomes. The existing producer's hot and cold decoding preserves `3000000000` significant units with 9 decimals in the successful fixtures.

## Acceptance and release checks

1. Rosen confirms the existing components' extension contract and supplies an implementation/version. Keep the generic component change distinct from Avalanche registration and app wiring.
2. Exported declarations accept the chosen input on Card and List; installed JavaScript forwards and consumes it. Positive type checks cover old callers and the new accepted contract.
3. Component tests prove identifier href behavior for both deployments, missing/unsupported deployment, native precedence, legacy fallback and Card-to-List forwarding. The card's “See All” href remains independent.
4. The dashboard uses the network-owned validated metadata or URL, including coherent hot/cold deployment and token identity. Its existing amounts, significant decimals, ordering, five-item limit and loading/error behavior remain intact.
5. A browser test checks the actual identifier anchor targets on desktop and mobile for the supplied component. URL equality does not require requests to the explorer. A successful `/assets` link does not substitute for the dashboard check.
6. Rebuild applicable packages in their normal order, resolve the supplied ui-kit version from the intended registry, regenerate the ordinary lockfile, then run the normal clean install/build and focused tests. The release level/version is the component maintainer's decision; no future version is assumed here.

The current installed-port proof has two valid existing-prop controls and five expected type rejections. Its JavaScript inspection confirms that Card's href is “See All” only and List neither reads a token href nor forwards chainId. Ten fixtures also check the existing URL producer and helper. These checks establish the missing input and usable producer behavior; they do not validate an implementation of the proposed port.
