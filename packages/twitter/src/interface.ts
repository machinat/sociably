import { ChannelSettingsAccessor } from '@sociably/core';
import { makeInterface } from '@sociably/core/service';
import TwitterUser from './User';
import type {
  TwitterPlatformUtilities,
  TwitterPlatformConfigs,
  TwitterAgentSettings,
} from './types';

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

export type AgentSettingsAccessorI = ChannelSettingsAccessor<
  TwitterUser,
  TwitterAgentSettings
>;

/**
 * @category Interface
 */
export const AgentSettingsAccessorI = makeInterface<AgentSettingsAccessorI>({
  name: 'TwitterAgentSettingsAccessor',
});
