import { ChannelSettingsAccessorI } from '../interface';
import {
  LineChatChannelSettings,
  LineLoginChannelSettings,
  LineProviderSettings,
} from '../types';

const getLoginChannelIdFromLiffId = (liffId: string): string =>
  liffId.split('-', 1)[0];

export const createSingleStaticChannelSettingsAccessor = (
  channelSettings: LineChatChannelSettings
): ChannelSettingsAccessorI => {
  const liffIds = channelSettings.liff
    ? Object.values(channelSettings.liff)
    : [];
  const loginChannelIds = liffIds.map(getLoginChannelIdFromLiffId);

  return {
    getChannelSettings: async (channel) =>
      channel.id === channelSettings.channelId ? channelSettings : null,
    getChannelSettingsBatch: async (channels) =>
      channels.map((channel) =>
        channel.id === channelSettings.channelId ? channelSettings : null
      ),
    listAllChannelSettings: async () => [channelSettings],
    getLineChatChannelSettingsByBotUserId: async () => channelSettings,
    getLineLoginChannelSettings: async (loginChannelId) =>
      loginChannelIds.includes(loginChannelId)
        ? {
            providerId: channelSettings.providerId,
            channelId: loginChannelId,
            liffIds,
            refChatChannelIds: [channelSettings.channelId],
          }
        : null,
  };
};

type SettingsWithBotUserId = LineChatChannelSettings & {
  botUserId: string;
};

export const createMultiStaticNumberSettingsAccessor = (
  providerSettingsList: LineProviderSettings[]
): ChannelSettingsAccessorI => {
  const messagingChannelsSettings = new Map<string, SettingsWithBotUserId>();
  const loginChannelsSettings = new Map<string, LineLoginChannelSettings>();

  for (const { providerId, channels, fallbackLiff } of providerSettingsList) {
    for (const {
      channelId,
      channelSecret,
      accessToken,
      botUserId,
      liff,
    } of channels) {
      const channelSettings = {
        providerId,
        channelId,
        channelSecret,
        accessToken,
        botUserId,
        liff,
      };
      messagingChannelsSettings.set(channelId, channelSettings);

      const liffSettings = liff ?? fallbackLiff;
      const liffIds = liffSettings ? Object.values(liffSettings) : [];
      const loginChannelIds = liffIds.map(getLoginChannelIdFromLiffId);

      for (const loginChannelId of loginChannelIds) {
        const loginChannelSettings = loginChannelsSettings.get(loginChannelId);
        if (loginChannelSettings) {
          if (loginChannelSettings.providerId !== providerId) {
            throw new Error(
              `Provider ID mismatch: ${loginChannelSettings.providerId} !== ${providerId}`
            );
          }

          loginChannelSettings.liffIds = [
            ...new Set([...loginChannelSettings.liffIds, ...liffIds]),
          ];
          loginChannelSettings.refChatChannelIds = [
            ...new Set([...loginChannelSettings.refChatChannelIds, channelId]),
          ];
        } else {
          loginChannelsSettings.set(loginChannelId, {
            providerId,
            channelId: loginChannelId,
            liffIds,
            refChatChannelIds: [channelId],
          });
        }
      }
    }
  }

  return {
    getChannelSettings: async ({ id: channelId }) =>
      messagingChannelsSettings.get(channelId) || null,
    getChannelSettingsBatch: async (channels) =>
      channels.map(
        ({ id: channelId }) => messagingChannelsSettings.get(channelId) || null
      ),
    listAllChannelSettings: async () => [...messagingChannelsSettings.values()],
    getLineChatChannelSettingsByBotUserId: async (botUserId) => {
      for (const settings of messagingChannelsSettings.values()) {
        if (settings.botUserId === botUserId) {
          return settings;
        }
      }
      return null;
    },
    getLineLoginChannelSettings: async (loginChannelId) => {
      return loginChannelsSettings.get(loginChannelId) || null;
    },
  };
};
