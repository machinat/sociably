import { makeInterface } from '@machinat/core/service';
import type { TelegramPlatformMounter, TelegramPlatformConfigs } from './types';

/**
 * @category Interface
 */
export const PLATFORM_CONFIGS_I = makeInterface<TelegramPlatformConfigs>({
  name: 'TelegramPlatformConfigsI',
});

/**
 * @category Interface
 */
export const PLATFORM_MOUNTER_I = makeInterface<TelegramPlatformMounter>({
  name: 'TelegramPlatformMounterI',
});
