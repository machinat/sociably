import { AgentSettingsAccessorI } from '../interface.js';
import {
  LineChatChannelSettings,
  LineLoginChannelSettings,
  LineProviderSettings,
} from '../types.js';

const getLoginChannelIdFromLiffId = (liffId: string): string =>
  liffId.split('-', 1)[0];

export const createSingleStaticAgentSettingsAccessor = (
  agentSettings: Omit<LineChatChannelSettings, 'botUserId'> & {
    botUserId?: string;
  },
): AgentSettingsAccessorI => {
  const liffIds = agentSettings.liff ? Object.values(agentSettings.liff) : [];
  const loginChannelIds = liffIds.map(getLoginChannelIdFromLiffId);

  const polishedChannelSettings = {
    ...agentSettings,
    botUserId: agentSettings?.botUserId || '',
  };

  const getChannelSettings = (channel) =>
    channel.id === agentSettings.channelId ? polishedChannelSettings : null;

  return {
    getAgentSettings: async (channel) => getChannelSettings(channel),
    getAgentSettingsBatch: async (channels) => channels.map(getChannelSettings),
    getLineChatChannelSettingsByBotUserId: async () => polishedChannelSettings,
    getLineLoginChannelSettings: async (loginChannelId) =>
      loginChannelIds.includes(loginChannelId)
        ? {
            providerId: agentSettings.providerId,
            channelId: loginChannelId,
            liffIds,
            refChatChannelIds: [agentSettings.channelId],
          }
        : null,
  };
};

type SettingsWithBotUserId = LineChatChannelSettings & {
  botUserId: string;
};

export const createMultiStaticNumberSettingsAccessor = (
  providerSettingsList: LineProviderSettings[],
): AgentSettingsAccessorI => {
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
      const agentSettings = {
        providerId,
        channelId,
        channelSecret,
        accessToken,
        botUserId,
        liff,
      };
      messagingChannelsSettings.set(channelId, agentSettings);

      const liffSettings = liff ?? fallbackLiff;
      const liffIds = liffSettings ? Object.values(liffSettings) : [];
      const loginChannelIds = liffIds.map(getLoginChannelIdFromLiffId);

      for (const loginChannelId of loginChannelIds) {
        const loginChannelSettings = loginChannelsSettings.get(loginChannelId);
        if (loginChannelSettings) {
          if (loginChannelSettings.providerId !== providerId) {
            throw new Error(
              `Provider ID mismatch: ${loginChannelSettings.providerId} !== ${providerId}`,
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
    getAgentSettings: async ({ id: channelId }) =>
      messagingChannelsSettings.get(channelId) || null,
    getAgentSettingsBatch: async (channels) =>
      channels.map(
        ({ id: channelId }) => messagingChannelsSettings.get(channelId) || null,
      ),
    getLineChatChannelSettingsByBotUserId: async (botUserId) => {
      for (const settings of messagingChannelsSettings.values()) {
        if (settings.botUserId === botUserId) {
          return settings;
        }
      }
      return null;
    },
    getLineLoginChannelSettings: async (loginChannelId) =>
      loginChannelsSettings.get(loginChannelId) || null,
  };
};
