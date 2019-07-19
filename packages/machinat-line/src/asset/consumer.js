// @flow
import type { ResourceConsumption } from 'machinat-asset-store/types';
import { LIFF, RICH_MENU } from './resourceType';

export const getLIFFApp = (
  label: string,
  options?: { invariant?: boolean }
): ResourceConsumption => ({
  label,
  resource: LIFF,
  invariant: !!(options && options.invariant),
});

export const getRichMenu = (
  label: string,
  options?: { invariant?: boolean }
): ResourceConsumption => ({
  label,
  resource: RICH_MENU,
  invariant: !!(options && options.invariant),
});
