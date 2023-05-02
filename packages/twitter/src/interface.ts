import { ChannelSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import TwitterUser from './User';
import type {
  TwitterPlatformUtilities,
  TwitterPlatformConfigs,
  TwitterAgentSettings,
} from './types';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<TwitterPlatformConfigs>({
  name: 'TwitterConfigs',
});

export type ConfigsI = TwitterPlatformConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = serviceInterface<TwitterPlatformUtilities>({
  name: 'TwitterPlatformUtilities',
});

export type AgentSettingsAccessorI = ChannelSettingsAccessor<
  TwitterUser,
  TwitterAgentSettings
>;

/**
 * @category Interface
 */
export const AgentSettingsAccessorI = serviceInterface<AgentSettingsAccessorI>({
  name: 'TwitterAgentSettingsAccessor',
});
