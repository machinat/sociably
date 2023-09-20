import { serviceInterface } from '@sociably/core/service';
import { AgentSettingsAccessor } from '@sociably/core';
import TelegramUser from './User.js';
import type {
  TelegramPlatformUtilities,
  TelegramConfigs,
  TelegramAgentSettings,
} from './types.js';

/** @category Interface */
export const ConfigsI = serviceInterface<TelegramConfigs>({
  name: 'TelegramConfigs',
});

export type ConfigsI = TelegramConfigs;

/** @category Interface */
export const PlatformUtilitiesI = serviceInterface<TelegramPlatformUtilities>({
  name: 'TelegramPlatformUtilities',
});

export type AgentSettingsAccessorI = AgentSettingsAccessor<
  TelegramUser,
  TelegramAgentSettings
>;

/** @category Interface */
export const AgentSettingsAccessorI = serviceInterface<AgentSettingsAccessorI>({
  name: 'TelegramAgentSettingsAccessor',
});
