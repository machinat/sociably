import type TelegramUser from '../User';
import { BotSettingsAccessorI } from '../interface';
import { TelegramBotSettings } from '../types';

const createStaticBotSettingsAccessor = (
  settings: TelegramBotSettings[]
): BotSettingsAccessorI => {
  const findSettingsWithMatchedToken = ({ id: botId }: TelegramUser) =>
    settings.find(({ botToken }) => botToken.startsWith(`${botId}:`)) || null;

  return {
    getAgentSettings: async (bot) => findSettingsWithMatchedToken(bot),
    getAgentSettingsBatch: async (bots) =>
      bots.map(findSettingsWithMatchedToken),
  };
};

export default createStaticBotSettingsAccessor;
