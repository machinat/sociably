import { makeInterface } from '@machinat/core/service';
import type { TelegramPlatformMounter, TelegramConfigs } from './types';

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
export const PlatformMounterI = makeInterface<TelegramPlatformMounter>({
  name: 'TelegramPlatformMounter',
});
