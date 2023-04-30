import type TelegramUser from '../User';
import { BotSettingsAccessorI } from '../interface';
import { TelegramBotSettings } from '../types';

const createStaticBotSettingsAccessor = (
  settings: TelegramBotSettings[]
): BotSettingsAccessorI => {
  const findSettingsWithMatchedToken = ({ id: botId }: TelegramUser) =>
    settings.find(({ botToken }) => botToken.startsWith(`${botId}:`)) || null;

  return {
    getChannelSettings: async (bot) => findSettingsWithMatchedToken(bot),
    getChannelSettingsBatch: async (bots) =>
      bots.map(findSettingsWithMatchedToken),
    listAllChannelSettings: async () => settings,
  };
};

export default createStaticBotSettingsAccessor;
