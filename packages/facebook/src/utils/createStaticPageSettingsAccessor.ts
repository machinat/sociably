import { FacebookPageSettings } from '../types';
import { PageSettingsAccessorI } from '../interface';

const createStaticPageSettingsAccessor = (
  settings: FacebookPageSettings[]
): PageSettingsAccessorI => ({
  getAgentSettings: async (page) =>
    settings.find(({ pageId }) => pageId === page.id) || null,
  getAgentSettingsBatch: async (pages) =>
    pages.map(
      (page) => settings.find(({ pageId }) => pageId === page.id) || null
    ),
});

export default createStaticPageSettingsAccessor;
