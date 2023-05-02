import { ChannelSettingsAccessor } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type LineChannel from './Channel';
import type {
  LineConfigs,
  LinePlatformUtilities,
  LineChatChannelSettings,
  LineLoginChannelSettings,
} from './types';

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

export interface ChannelSettingsAccessorI
  extends ChannelSettingsAccessor<LineChannel, LineChatChannelSettings> {
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
export const ChannelSettingsAccessorI =
  serviceInterface<ChannelSettingsAccessorI>({
    name: 'LineChannelSettingsAccessor',
  });
