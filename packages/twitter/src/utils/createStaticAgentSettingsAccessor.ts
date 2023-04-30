import { TwitterAgentSettings } from '../types';
import { AgentSettingsAccessorI } from '../interface';

const createStaticAgentSettingsAccessor = (
  settings: TwitterAgentSettings[]
): AgentSettingsAccessorI => ({
  getChannelSettings: async (agent) =>
    settings.find(({ userId }) => userId === agent.id) || null,
  getChannelSettingsBatch: async (agents) =>
    agents.map(
      (agent) => settings.find(({ userId }) => userId === agent.id) || null
    ),
  listAllChannelSettings: async () => settings,
});

export default createStaticAgentSettingsAccessor;
