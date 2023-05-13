import { TwitterAgentSettings } from '../types';
import { AgentSettingsAccessorI } from '../interface';

const createStaticAgentSettingsAccessor = (
  settings: TwitterAgentSettings[]
): AgentSettingsAccessorI => ({
  getAgentSettings: async (agent) =>
    settings.find(({ userId }) => userId === agent.id) || null,
  getAgentSettingsBatch: async (agents) =>
    agents.map(
      (agent) => settings.find(({ userId }) => userId === agent.id) || null
    ),
});

export default createStaticAgentSettingsAccessor;
