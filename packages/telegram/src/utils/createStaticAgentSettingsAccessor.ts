import type TelegramUser from '../User';
import { AgentSettingsAccessorI } from '../interface';
import { TelegramAgentSettings } from '../types';

const createStaticAgentSettingsAccessor = (
  settings: TelegramAgentSettings[]
): AgentSettingsAccessorI => {
  const findSettingsWithMatchedToken = ({ id: botId }: TelegramUser) =>
    settings.find(({ botToken }) => botToken.startsWith(`${botId}:`)) || null;

  return {
    getAgentSettings: async (bot) => findSettingsWithMatchedToken(bot),
    getAgentSettingsBatch: async (bots) =>
      bots.map(findSettingsWithMatchedToken),
  };
};

export default createStaticAgentSettingsAccessor;
