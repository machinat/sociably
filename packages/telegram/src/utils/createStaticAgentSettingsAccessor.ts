import type TelegramUser from '../User.js';
import { AgentSettingsAccessorI } from '../interface.js';
import { TelegramAgentSettings } from '../types.js';

const createStaticAgentSettingsAccessor = (
  settings: TelegramAgentSettings[],
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
