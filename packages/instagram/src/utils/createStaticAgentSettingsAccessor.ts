import { InstagramAgentSettings } from '../types.js';
import { AgentSettingsAccessorI } from '../interface.js';

const createStaticAgentSettingsAccessor = (
  settings: InstagramAgentSettings[]
): AgentSettingsAccessorI => ({
  getAgentSettings: async (agent) =>
    settings.find(({ accountId }) => accountId === agent.id) || null,
  getAgentSettingsBatch: async (agents) =>
    agents.map(
      (agent) =>
        settings.find(({ accountId }) => accountId === agent.id) || null
    ),
});

export default createStaticAgentSettingsAccessor;
