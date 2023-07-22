import { AgentSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type InstagramPage from './Page.js';
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
  InstagramPage,
  InstagramAgentSettings
>;

/**
 * @category Interface
 */
export const AgentSettingsAccessorI = serviceInterface<
  AgentSettingsAccessor<InstagramPage, InstagramAgentSettings>
>({
  name: 'InstagramAgentSettingsAccessor',
});
