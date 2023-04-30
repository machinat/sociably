import { ChannelSettingsAccessor } from '@sociably/core';
import { makeInterface } from '@sociably/core/service';
import type FacebookPage from './Page';
import type {
  FacebookPlatformUtilities,
  FacebookConfigs,
  FacebookPageSettings,
} from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<FacebookConfigs>({
  name: 'FacebookConfigs',
});

export type ConfigsI = FacebookConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = makeInterface<FacebookPlatformUtilities>({
  name: 'FacebookPlatformUtilities',
});

export type PageSettingsAccessorI = ChannelSettingsAccessor<
  FacebookPage,
  FacebookPageSettings
>;

/**
 * @category Interface
 */
export const PageSettingsAccessorI = makeInterface<
  ChannelSettingsAccessor<FacebookPage, FacebookPageSettings>
>({
  name: 'FacebookPageSettingsAccessor',
});
