// @flow
import type { ResourceConsumption } from 'machinat-asset-store/types';
import { LIFF, RICH_MENU } from './resourceType';

export const getLIFFApp = (
  name: string,
  options?: { invariant?: boolean }
): ResourceConsumption => ({
  name,
  resource: LIFF,
  invariant: !!(options && options.invariant),
});

export const getRichMenu = (
  name: string,
  options?: { invariant?: boolean }
): ResourceConsumption => ({
  name,
  resource: RICH_MENU,
  invariant: !!(options && options.invariant),
});
