import { FacebookPageSettings } from '../types.js';
import { AgentSettingsAccessorI } from '../interface.js';

const createStaticAgentSettingsAccessor = (
  settings: FacebookPageSettings[],
): AgentSettingsAccessorI => ({
  getAgentSettings: async (page) =>
    settings.find(({ pageId }) => pageId === page.id) || null,
  getAgentSettingsBatch: async (pages) =>
    pages.map(
      (page) => settings.find(({ pageId }) => pageId === page.id) || null,
    ),
});

export default createStaticAgentSettingsAccessor;
