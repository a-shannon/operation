import type { TokensCard, TokensList } from '@rosen-bridge/ui-kit';
import { getTokenUrl } from 'installed-token-url';

type CardProps = Parameters<typeof TokensCard>[0];
type ListProps = Parameters<typeof TokensList>[0];
type CardToken = CardProps['tokens'][number];

const token: CardToken = {
  amount: 3_000_000_000,
  coldAmount: 3_000_000_000,
  decimals: 9,
  name: 'Synthetic token',
  tokenId: '0x1111111111111111111111111111111111111111',
  isNativeToken: false,
};

const card: CardProps = {
  chain: 'avalanche',
  loading: false,
  title: 'Avalanche',
  tokens: [token],
  href: '/assets',
};

const list: ListProps = { chain: 'avalanche', loading: false, tokens: [token] };

const tokenHref: CardToken = {
  ...token,
  // @ts-expect-error Installed token item has no explicit href port.
  href: 'https://snowtrace.io/token/0x1111111111111111111111111111111111111111',
};

const tokenUrl: CardToken = {
  ...token,
  // @ts-expect-error Installed token item has no tokenUrl port either.
  tokenUrl: 'https://snowtrace.io/token/0x1111111111111111111111111111111111111111',
};

const cardChainId: CardProps = {
  ...card,
  // @ts-expect-error Installed TokensCard has no chainId input.
  chainId: 43114,
};

const listChainId: ListProps = {
  ...list,
  // @ts-expect-error Installed TokensList has no chainId input.
  chainId: 43114,
};

// @ts-expect-error Installed helper accepts only network and tokenId.
getTokenUrl('avalanche', token.tokenId, 43114);

void [card, list, tokenHref, tokenUrl, cardChainId, listChainId];
