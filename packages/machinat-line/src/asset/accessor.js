// @flow
import type {
  AssetStore,
  ScopedAssetAccessor,
} from 'machinat-asset-store/types';
import type LineBot from '../bot';
import { LINE, PATH_RICHMENU, PATH_LIFFAPPS } from '../constant';
import { LIFF, RICH_MENU } from './resourceType';

class LineAssetsAccessor implements ScopedAssetAccessor {
  store: AssetStore;
  bot: LineBot;
  channelId: string;

  constructor(store: AssetStore, bot: LineBot) {
    this.store = store;
    this.bot = bot;
    this.channelId = bot.options.channelId;
  }

  getAsset(resource: string, tag: string) {
    return this.store.get(LINE, this.channelId, resource, tag);
  }

  setAsset(resource: string, tag: string, id: string | number) {
    return this.store.set(LINE, this.channelId, resource, tag, id);
  }

  listAssets(resource: string) {
    return this.store.list(LINE, this.channelId, resource);
  }

  deleteAsset(resource: string, tag: string) {
    return this.store.delete(LINE, this.channelId, resource, tag);
  }

  deleteAssetById(resource: string, id: string) {
    return this.store.deleteById(LINE, this.channelId, resource, id);
  }

  getLIFFAppId(tag: string): Promise<void | string> {
    return (this.getAsset(LIFF, tag): any);
  }

  async createLIFFApp(tag: string, body: Object): Promise<string> {
    const existed = await this.getLIFFAppId(tag);
    if (existed !== undefined) {
      throw new Error();
    }

    const { richMenuId } = await this.bot.dispatchAPICall(
      'POST',
      PATH_LIFFAPPS,
      body
    );

    await this.setAsset(LIFF, tag, richMenuId);
    return richMenuId;
  }

  async updateLIFFApp(tag: string, body: Object): Promise<string> {
    const id = await this.getLIFFAppId(tag);
    if (id === undefined) {
      throw new Error();
    }

    await this.bot.dispatchAPICall('PUT', `${PATH_LIFFAPPS}/${id}`, body);
    return id;
  }

  async deleteLIFFApp(tag: string): Promise<string> {
    const id = await this.getLIFFAppId(tag);
    if (id === undefined) {
      throw new Error();
    }

    await this.bot.dispatchAPICall('DELETE', `${PATH_LIFFAPPS}/${id}`);
    await this.deleteAsset(LIFF, tag);
    return id;
  }

  getRichMenuId(tag: string): Promise<void | string> {
    return (this.getAsset(RICH_MENU, tag): any);
  }

  async createRichMenu(tag: string, body: Object): Promise<string> {
    const id = await this.getRichMenuId(tag);
    if (id === undefined) {
      throw new Error();
    }

    const { richMenuId } = await this.bot.dispatchAPICall(
      'POST',
      PATH_RICHMENU,
      body
    );

    await this.setAsset(RICH_MENU, tag, richMenuId);
    return richMenuId;
  }

  async deleteRichMenu(tag: string): Promise<string> {
    const id = await this.getRichMenuId(tag);
    if (id === undefined) {
      throw new Error();
    }

    await this.bot.dispatchAPICall('DELETE', `${PATH_RICHMENU}/${id}`);

    await this.deleteAsset(RICH_MENU, tag);
    return id;
  }
}

export default LineAssetsAccessor;
