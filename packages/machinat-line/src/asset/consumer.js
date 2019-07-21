// @flow
import type { AssetConsumerTarget } from 'machinat-asset-store/types';
import { LIFF, RICH_MENU } from './resourceType';

export const getLIFFAppId = (
  tag: string,
  options?: { invariant?: boolean }
): AssetConsumerTarget => ({
  tag,
  resource: LIFF,
  invariant: !!(options && options.invariant),
});

export const getRichMenuId = (
  tag: string,
  options?: { invariant?: boolean }
): AssetConsumerTarget => ({
  tag,
  resource: RICH_MENU,
  invariant: !!(options && options.invariant),
});
