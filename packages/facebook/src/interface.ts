import { makeInterface } from '@sociably/core/service';
import type { FacebookPlatformUtilities, FacebookConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<FacebookConfigs>({
  name: 'FacebookConfigs',
});

export type ConfigsI = FacebookConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = makeInterface<FacebookPlatformUtilities>({
  name: 'FacebookPlatformUtilities',
});
