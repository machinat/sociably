import { makeInterface } from '@sociably/core/service';
import type { WhatsAppPlatformUtilities, WhatsAppConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<WhatsAppConfigs>({
  name: 'WhatsAppConfigs',
});

export type ConfigsI = WhatsAppConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = makeInterface<WhatsAppPlatformUtilities>({
  name: 'WhatsAppPlatformUtilities',
});
