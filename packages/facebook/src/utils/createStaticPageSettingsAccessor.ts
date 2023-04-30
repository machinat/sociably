import { FacebookPageSettings } from '../types';
import { PageSettingsAccessorI } from '../interface';

const createStaticPageSettingsAccessor = (
  settings: FacebookPageSettings[]
): PageSettingsAccessorI => ({
  getChannelSettings: async (page) =>
    settings.find(({ pageId }) => pageId === page.id) || null,
  getChannelSettingsBatch: async (pages) =>
    pages.map(
      (page) => settings.find(({ pageId }) => pageId === page.id) || null
    ),
  listAllChannelSettings: async () => settings,
});

export default createStaticPageSettingsAccessor;
