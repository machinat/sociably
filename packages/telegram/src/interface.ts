import { serviceInterface } from '@sociably/core/service';
import { AgentSettingsAccessor } from '@sociably/core';
import TelegramUser from './User';
import type {
  TelegramPlatformUtilities,
  TelegramConfigs,
  TelegramBotSettings,
} from './types';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<TelegramConfigs>({
  name: 'TelegramConfigs',
});

export type ConfigsI = TelegramConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = serviceInterface<TelegramPlatformUtilities>({
  name: 'TelegramPlatformUtilities',
});

export type BotSettingsAccessorI = AgentSettingsAccessor<
  TelegramUser,
  TelegramBotSettings
>;

/**
 * @category Interface
 */
export const BotSettingsAccessorI = serviceInterface<BotSettingsAccessorI>({
  name: 'TelegramBotSettingsAccessor',
});
