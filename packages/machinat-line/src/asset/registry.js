// @flow
import { provider } from '@machinat/core/service';
import StateManager from '@machinat/state'; // eslint-disable-line import/no-extraneous-dependencies
import LineBot from '../bot';
import { PATH_RICHMENU } from '../constant';

const LIFF = 'liff';
const RICH_MENU = 'rich_menu';

class LineAssetsRegistry {
  channelId: string;
  _stateManager: StateManager;
  _bot: LineBot;

  constructor(stateMaanger: StateManager, bot: LineBot) {
    this.channelId = bot.channelId;
    this._stateManager = stateMaanger;
    this._bot = bot;
  }

  _makeResourceToken(resource: string) {
    return `line.assets:${this.channelId}:${resource}`;
  }

  async getAssetId(resource: string, tag: string): Promise<void | string> {
    const existed = await this._stateManager
      .namedState(this._makeResourceToken(resource))
      .get<string>(tag);

    return existed || undefined;
  }

  async setAssetId(resource: string, tag: string, id: string): Promise<void> {
    await this._stateManager
      .namedState(this._makeResourceToken(resource))
      .set<string>(tag, existed => {
        if (existed) {
          throw new Error(`${resource} [ ${tag} ] already exist`);
        }
        return id;
      });
  }

  getAllAssets(resource: string): Promise<null | Map<string, string>> {
    return this._stateManager
      .namedState(this._makeResourceToken(resource))
      .getAll();
  }

  async removeAssetId(resource: string, tag: string): Promise<void> {
    const isDeleted = await this._stateManager
      .namedState(this._makeResourceToken(resource))
      .delete(tag);

    if (!isDeleted) {
      throw new Error(`${resource} [ ${tag} ] not exist`);
    }
  }

  getLIFFAppId(tag: string): Promise<void | string> {
    return this.getAssetId(LIFF, tag);
  }

  setLIFFAppId(tag: string, id: string) {
    return this.setAssetId(LIFF, tag, id);
  }

  getAllLIFFApps() {
    return this.getAllAssets(LIFF);
  }

  removeLIFFAppId(tag: string) {
    return this.removeAssetId(LIFF, tag);
  }

  getRichMenuId(tag: string) {
    return this.getAssetId(RICH_MENU, tag);
  }

  setRichMenuId(tag: string, id: string) {
    return this.setAssetId(RICH_MENU, tag, id);
  }

  getAllRichMenus() {
    return this.getAllAssets(RICH_MENU);
  }

  removeRichMenuId(tag: string) {
    return this.removeAssetId(RICH_MENU, tag);
  }

  async createRichMenu(tag: string, body: Object): Promise<string> {
    const existed = await this.getRichMenuId(tag);
    if (existed) {
      throw new Error(`rich menu [ ${tag} ] already exist`);
    }

    const {
      results: [{ richMenuId }],
    } = await this._bot.dispatchAPICall('POST', PATH_RICHMENU, body);

    await this.setAssetId(RICH_MENU, tag, richMenuId);
    return richMenuId;
  }

  async deleteRichMenu(tag: string): Promise<string> {
    const id = await this.getRichMenuId(tag);
    if (id === undefined) {
      throw new Error(`rich menu [ ${tag} ] not exist`);
    }

    await this._bot.dispatchAPICall('DELETE', `${PATH_RICHMENU}/${id}`);

    await this.removeAssetId(RICH_MENU, tag);
    return id;
  }
}

export default provider<LineAssetsRegistry>({
  lifetime: 'scoped',
  deps: [StateManager, LineBot],
})(LineAssetsRegistry);
