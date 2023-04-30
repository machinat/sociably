import { ChannelSettingsAccessor } from '@sociably/core';
import { makeInterface } from '@sociably/core/service';
import type WhatsAppAgent from './Agent';
import type {
  WhatsAppPlatformUtilities,
  WhatsAppConfigs,
  WhatsAppAgentSettings,
} from './types';

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

export type AgentSettingsAccessorI = ChannelSettingsAccessor<
  WhatsAppAgent,
  WhatsAppAgentSettings
>;

/**
 * @category Interface
 */
export const AgentSettingsAccessorI = makeInterface<AgentSettingsAccessorI>({
  name: 'WhatsAppAgentSettingsAccessor',
});
