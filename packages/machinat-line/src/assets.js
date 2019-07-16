// @flow
import type {
  AssetStore,
  ScopedAssetAccessor,
} from 'machinat-asset-store/types';
import type { LineBotPlugin } from './types';
import type LineBot from './bot';
import { LINE } from './constant';

const LIFF = 'liff';

class LineAssetsManager implements ScopedAssetAccessor {
  entityCode: string;
  store: AssetStore;

  constructor(store: AssetStore, lineChannelId?: string) {
    this.entityCode = lineChannelId || '*';
    this.store = store;
  }

  getAsset(resource: string, name: string) {
    return this.store.getAsset(LINE, this.entityCode, resource, name);
  }

  setAsset(resource: string, name: string, id: string | number) {
    return this.store.setAsset(LINE, this.entityCode, resource, name, id);
  }

  listAssets(resource: string) {
    return this.store.listAssets(LINE, this.entityCode, resource);
  }

  deleteAsset(resource: string, name: string) {
    return this.store.deleteAsset(LINE, this.entityCode, resource, name);
  }

  getLIFFApp(name: string) {
    return this.store.getAsset(LINE, this.entityCode, LIFF, name);
  }
}

const lineAssets = (store: AssetStore): LineBotPlugin => (bot: LineBot) => {
  const manager = new LineAssetsManager(store, bot.options.channelId);

  return {
    eventMiddlware(next) {
      return frame => next({ ...frame, assets: manager });
    },
  };
};

export default lineAssets;
