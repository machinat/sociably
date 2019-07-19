// @flow
import type {
  AssetStore,
  ScopedAssetAccessor,
} from 'machinat-asset-store/types';
import { LINE } from '../constant';
import { LIFF, RICH_MENU } from './resourceType';

class LineAssetAccessor implements ScopedAssetAccessor {
  channelId: string;
  store: AssetStore;

  constructor(store: AssetStore, lineChannelId: string) {
    this.channelId = lineChannelId;
    this.store = store;
  }

  getAsset(resource: string, label: string) {
    return this.store.get(LINE, this.channelId, resource, label);
  }

  setAsset(resource: string, label: string, id: string | number) {
    return this.store.set(LINE, this.channelId, resource, label, id);
  }

  listAssets(resource: string) {
    return this.store.list(LINE, this.channelId, resource);
  }

  deleteAsset(resource: string, label: string) {
    return this.store.delete(LINE, this.channelId, resource, label);
  }

  deleteAssetById(resource: string, id: string) {
    return this.store.deleteById(LINE, this.channelId, resource, id);
  }

  getLIFFApp(label: string): Promise<void | string> {
    return (this.getAsset(LIFF, label): any);
  }

  getRichMenu(label: string): Promise<void | string> {
    return (this.getAsset(RICH_MENU, label): any);
  }
}

export default LineAssetAccessor;
