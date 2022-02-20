import { makeInterface } from '@machinat/core/service';
import type { TwitterPlatformUtilities, TwitterPlatformConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<TwitterPlatformConfigs>({
  name: 'TwitterConfigs',
});

export type ConfigsI = TwitterPlatformConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = makeInterface<TwitterPlatformUtilities>({
  name: 'TwitterPlatformUtilities',
});
