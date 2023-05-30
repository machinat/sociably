import { AgentSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type FacebookPage from './Page.js';
import type {
  FacebookPlatformUtilities,
  FacebookConfigs,
  FacebookPageSettings,
} from './types.js';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<FacebookConfigs>({
  name: 'FacebookConfigs',
});

export type ConfigsI = FacebookConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = serviceInterface<FacebookPlatformUtilities>({
  name: 'FacebookPlatformUtilities',
});

export type AgentSettingsAccessorI = AgentSettingsAccessor<
  FacebookPage,
  FacebookPageSettings
>;

/**
 * @category Interface
 */
export const AgentSettingsAccessorI = serviceInterface<
  AgentSettingsAccessor<FacebookPage, FacebookPageSettings>
>({
  name: 'FacebookAgentSettingsAccessor',
});
