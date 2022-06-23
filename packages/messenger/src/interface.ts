import { makeInterface } from '@sociably/core/service';
import type { MessengerPlatformUtilities, MessengerConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<MessengerConfigs>({
  name: 'MessengerConfigs',
});

export type ConfigsI = MessengerConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = makeInterface<MessengerPlatformUtilities>({
  name: 'MessengerPlatformUtilities',
});
