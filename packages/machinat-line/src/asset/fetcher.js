// @flow
import type { AssetsConsumerTarget } from 'machinat-assets-store/types';
import { LIFF, RICH_MENU } from './resourceType';

export const liffAppId = (
  name: string,
  options?: { invariant?: boolean }
): AssetsConsumerTarget => ({
  name,
  resource: LIFF,
  invariant: !!(options && options.invariant),
});

export const richMenuId = (
  name: string,
  options?: { invariant?: boolean }
): AssetsConsumerTarget => ({
  name,
  resource: RICH_MENU,
  invariant: !!(options && options.invariant),
});
