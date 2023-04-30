import { ChannelSettingsAccessor } from '@sociably/core';
import { makeInterface } from '@sociably/core/service';
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
export const ConfigsI = makeInterface<LineConfigs>({
  name: 'LineConfigs',
});

export type ConfigsI = LineConfigs;

/**
 * @category Interface
 */
export const PlatformUtilitiesI = makeInterface<LinePlatformUtilities>({
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
export const ChannelSettingsAccessorI = makeInterface<ChannelSettingsAccessorI>(
  { name: 'LineChannelSettingsAccessor' }
);
