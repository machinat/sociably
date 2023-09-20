import { AgentSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type WhatsAppAgent from './Agent.js';
import type {
  WhatsAppPlatformUtilities,
  WhatsAppConfigs,
  WhatsAppAgentSettings,
} from './types.js';

/** @category Interface */
export const ConfigsI = serviceInterface<WhatsAppConfigs>({
  name: 'WhatsAppConfigs',
});

export type ConfigsI = WhatsAppConfigs;

/** @category Interface */
export const PlatformUtilitiesI = serviceInterface<WhatsAppPlatformUtilities>({
  name: 'WhatsAppPlatformUtilities',
});

export type AgentSettingsAccessorI = AgentSettingsAccessor<
  WhatsAppAgent,
  WhatsAppAgentSettings
>;

/** @category Interface */
export const AgentSettingsAccessorI = serviceInterface<AgentSettingsAccessorI>({
  name: 'WhatsAppAgentSettingsAccessor',
});
