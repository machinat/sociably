import { AgentSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type FacebookPage from './Page';
import type {
  FacebookPlatformUtilities,
  FacebookConfigs,
  FacebookPageSettings,
} from './types';

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

export type PageSettingsAccessorI = AgentSettingsAccessor<
  FacebookPage,
  FacebookPageSettings
>;

/**
 * @category Interface
 */
export const PageSettingsAccessorI = serviceInterface<
  AgentSettingsAccessor<FacebookPage, FacebookPageSettings>
>({
  name: 'FacebookPageSettingsAccessor',
});
