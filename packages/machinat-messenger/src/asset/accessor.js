// @flow
import type {
  AssetStore,
  ScopedAssetAccessor,
} from 'machinat-asset-store/types';
import { MESSENGER } from '../constant';
import {
  ATTACHMENT,
  CUSTOM_LABEL,
  MESSAGE_CREATIVE,
  PERSONA,
} from './resourceType';

class MessengerAssetManager implements ScopedAssetAccessor {
  store: AssetStore;
  pageId: string;

  constructor(store: AssetStore, pageId: string) {
    this.store = store;
    this.pageId = pageId;
  }

  getAsset(resource: string, label: string) {
    return this.store.get(MESSENGER, this.pageId, resource, label);
  }

  setAsset(resource: string, label: string, id: string | number) {
    return this.store.set(MESSENGER, this.pageId, resource, label, id);
  }

  listAssets(resource: string) {
    return this.store.list(MESSENGER, this.pageId, resource);
  }

  deleteAsset(resource: string, label: string) {
    return this.store.delete(MESSENGER, this.pageId, resource, label);
  }

  deleteAssetById(resource: string, id: string) {
    return this.store.deleteById(MESSENGER, this.pageId, resource, id);
  }

  getAttachment(label: string): Promise<void | string> {
    return (this.getAsset(ATTACHMENT, label): any);
  }

  getMessageCreative(label: string): Promise<void | string> {
    return (this.getAsset(MESSAGE_CREATIVE, label): any);
  }

  getCustomLabel(label: string): Promise<void | string> {
    return (this.getAsset(CUSTOM_LABEL, label): any);
  }

  getPersona(label: string): Promise<void | string> {
    return (this.getAsset(PERSONA, label): any);
  }
}

export default MessengerAssetManager;
