import { makeInterface } from '@machinat/core/service';
import type { LinePlatformConfigs, LinePlatformMounter } from './types';

/**
 * @category Interface
 */
export const PLATFORM_CONFIGS_I = makeInterface<LinePlatformConfigs>({
  name: 'LinePlatformConfigsI',
});

/**
 * @category Interface
 */
export const PLATFORM_MOUNTER_I = makeInterface<LinePlatformMounter>({
  name: 'LinePlatformMounterI',
});
