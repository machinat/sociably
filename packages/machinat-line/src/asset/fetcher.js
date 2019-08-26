// @flow
import type { AssetConsumerTarget } from 'machinat-asset-store/types';
import { LIFF, RICH_MENU } from './resourceType';

export const liffAppId = (
  name: string,
  options?: { invariant?: boolean }
): AssetConsumerTarget => ({
  name,
  resource: LIFF,
  invariant: !!(options && options.invariant),
});

export const richMenuId = (
  name: string,
  options?: { invariant?: boolean }
): AssetConsumerTarget => ({
  name,
  resource: RICH_MENU,
  invariant: !!(options && options.invariant),
});
