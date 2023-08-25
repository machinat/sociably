import { AgentSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type InstagramAgent from './Agent.js';
import type {
  InstagramPlatformUtilities,
  InstagramConfigs,
  InstagramAgentSettings,
} from './types.js';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<InstagramConfigs>({
  name: 'InstagramConfigs',
});

export type ConfigsI = InstagramConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = serviceInterface<InstagramPlatformUtilities>({
  name: 'InstagramPlatformUtilities',
});

export type AgentSettingsAccessorI = AgentSettingsAccessor<
  InstagramAgent,
  InstagramAgentSettings
>;

/**
 * @category Interface
 */
export const AgentSettingsAccessorI = serviceInterface<
  AgentSettingsAccessor<InstagramAgent, InstagramAgentSettings>
>({
  name: 'InstagramAgentSettingsAccessor',
});
