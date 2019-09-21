// @flow
import type {
  AssetsStore,
  AssetsRepository,
} from 'machinat-assets-store/types';
import type LineBot from '../bot';
import { LINE, PATH_RICHMENU, PATH_LIFFAPPS } from '../constant';
import { LIFF, RICH_MENU } from './resourceType';

class LineAssetsRepository implements AssetsRepository {
  store: AssetsStore;
  bot: LineBot;
  channelId: string;

  constructor(store: AssetsStore, bot: LineBot) {
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
      throw new Error(`liff app [ ${tag} ] already existed (${existed})`);
    }

    const { liffId } = await this.bot.dispatchAPICall(
      'POST',
      PATH_LIFFAPPS,
      body
    );

    await this.setAsset(LIFF, tag, liffId);
    return liffId;
  }

  async updateLIFFApp(tag: string, body: Object): Promise<string> {
    const id = await this.getLIFFAppId(tag);
    if (id === undefined) {
      throw new Error(`liff app [ ${tag} ] not existed`);
    }

    await this.bot.dispatchAPICall('PUT', `${PATH_LIFFAPPS}/${id}`, body);
    return id;
  }

  async deleteLIFFApp(tag: string): Promise<string> {
    const id = await this.getLIFFAppId(tag);
    if (id === undefined) {
      throw new Error(`liff app [ ${tag} ] not existed`);
    }

    await this.bot.dispatchAPICall('DELETE', `${PATH_LIFFAPPS}/${id}`);
    await this.deleteAsset(LIFF, tag);
    return id;
  }

  getRichMenuId(tag: string): Promise<void | string> {
    return (this.getAsset(RICH_MENU, tag): any);
  }

  async createRichMenu(tag: string, body: Object): Promise<string> {
    const existed = await this.getRichMenuId(tag);
    if (existed !== undefined) {
      throw new Error(`rich menu [ ${tag} ] already existed (${existed})`);
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
      throw new Error(`rich menu [ ${tag} ] not existed`);
    }

    await this.bot.dispatchAPICall('DELETE', `${PATH_RICHMENU}/${id}`);

    await this.deleteAsset(RICH_MENU, tag);
    return id;
  }
}

export default LineAssetsRepository;
