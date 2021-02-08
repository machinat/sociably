import { makeInterface } from '@machinat/core/service';
import type { MessengerPlatformMounter, MessengerConfigs } from './types';

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
export const PlatformMounterI = makeInterface<MessengerPlatformMounter>({
  name: 'MessengerPlatformMounter',
});
