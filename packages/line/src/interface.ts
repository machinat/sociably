import { AgentSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type LineChannel from './Channel.js';
import type {
  LineConfigs,
  LinePlatformUtilities,
  LineChatChannelSettings,
  LineLoginChannelSettings,
} from './types.js';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<LineConfigs>({
  name: 'LineConfigs',
});

export type ConfigsI = LineConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = serviceInterface<LinePlatformUtilities>({
  name: 'LinePlatformUtilities',
});

export interface AgentSettingsAccessorI
  extends AgentSettingsAccessor<LineChannel, LineChatChannelSettings> {
  getLineChatChannelSettingsByBotUserId(
    botUserId: string
  ): Promise<null | LineChatChannelSettings>;
  getLineLoginChannelSettings(
    channelId: string
  ): Promise<null | LineLoginChannelSettings>;
}

/**
 * @category Interface
 */
export const AgentSettingsAccessorI = serviceInterface<AgentSettingsAccessorI>({
  name: 'LineAgentSettingsAccessor',
});
