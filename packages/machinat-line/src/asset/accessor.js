// @flow
import type {
  AssetStore,
  ScopedAssetAccessor,
} from 'machinat-asset-store/types';
import { LINE } from '../constant';
import { LIFF, RICH_MENU } from './resourceType';

class LineAssetAccessor implements ScopedAssetAccessor {
  _entityCode: string;
  store: AssetStore;

  constructor(store: AssetStore, lineChannelId?: string) {
    this._entityCode = lineChannelId || '*';
    this.store = store;
  }

  getAsset(resource: string, name: string) {
    return this.store.getAsset(LINE, this._entityCode, resource, name);
  }

  setAsset(resource: string, name: string, id: string | number) {
    return this.store.setAsset(LINE, this._entityCode, resource, name, id);
  }

  listAssets(resource: string) {
    return this.store.listAssets(LINE, this._entityCode, resource);
  }

  deleteAsset(resource: string, name: string) {
    return this.store.deleteAsset(LINE, this._entityCode, resource, name);
  }

  getLIFFApp(name: string): Promise<void | string> {
    return (this.store.getAsset(LINE, this._entityCode, LIFF, name): any);
  }

  setLIFFApp(name: string, id: string) {
    return this.store.setAsset(LINE, this._entityCode, LIFF, name, id);
  }

  listLIFFApp() {
    return this.store.listAssets(LINE, this._entityCode, LIFF);
  }

  deleteLIFFApp(name: string) {
    return this.store.deleteAsset(LINE, this._entityCode, LIFF, name);
  }

  getRichMenu(name: string): Promise<void | string> {
    return (this.store.getAsset(LINE, this._entityCode, RICH_MENU, name): any);
  }

  setRichMenu(name: string, id: string) {
    return this.store.setAsset(LINE, this._entityCode, RICH_MENU, name, id);
  }

  listRichMenu() {
    return this.store.listAssets(LINE, this._entityCode, RICH_MENU);
  }

  deleteRichMenu(name: string) {
    return this.store.deleteAsset(LINE, this._entityCode, RICH_MENU, name);
  }
}

export default LineAssetAccessor;
