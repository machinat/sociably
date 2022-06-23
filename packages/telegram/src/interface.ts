import { makeInterface } from '@sociably/core/service';
import type { TelegramPlatformUtilities, TelegramConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<TelegramConfigs>({
  name: 'TelegramConfigs',
});

export type ConfigsI = TelegramConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = makeInterface<TelegramPlatformUtilities>({
  name: 'TelegramPlatformUtilities',
});
