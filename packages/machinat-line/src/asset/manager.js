// @flow
import { provider } from '@machinat/core/service';
import { StateControllerI } from '@machinat/core/base';
import LineBot from '../bot';
import { PATH_RICHMENU } from '../constant';

const LIFF = 'liff';
const RICH_MENU = 'rich_menu';

class LineAssetsManager {
  botChannelId: string;
  _stateController: StateControllerI;
  _bot: LineBot;

  constructor(stateMaanger: StateControllerI, bot: LineBot) {
    this.botChannelId = bot.botChannelId;
    this._stateController = stateMaanger;
    this._bot = bot;
  }

  _makeResourceToken(resource: string) {
    return `line.assets.${this.botChannelId}.${resource}`;
  }

  async getAssetId(resource: string, name: string): Promise<void | string> {
    const existed = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .get<string>(name);

    return existed || undefined;
  }

  async setAssetId(resource: string, name: string, id: string): Promise<void> {
    await this._stateController
      .globalState(this._makeResourceToken(resource))
      .set<string>(name, (existed) => {
        if (existed) {
          throw new Error(`${resource} [ ${name} ] already exist`);
        }
        return id;
      });
  }

  getAllAssets(resource: string): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(this._makeResourceToken(resource))
      .getAll();
  }

  async removeAssetId(resource: string, name: string): Promise<void> {
    const isDeleted = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .delete(name);

    if (!isDeleted) {
      throw new Error(`${resource} [ ${name} ] not exist`);
    }
  }

  getLIFFAppId(name: string): Promise<void | string> {
    return this.getAssetId(LIFF, name);
  }

  setLIFFAppId(name: string, id: string) {
    return this.setAssetId(LIFF, name, id);
  }

  getAllLIFFApps() {
    return this.getAllAssets(LIFF);
  }

  removeLIFFAppId(name: string) {
    return this.removeAssetId(LIFF, name);
  }

  getRichMenuId(name: string) {
    return this.getAssetId(RICH_MENU, name);
  }

  setRichMenuId(name: string, id: string) {
    return this.setAssetId(RICH_MENU, name, id);
  }

  getAllRichMenus() {
    return this.getAllAssets(RICH_MENU);
  }

  removeRichMenuId(name: string) {
    return this.removeAssetId(RICH_MENU, name);
  }

  async createRichMenu(name: string, body: Object): Promise<string> {
    const existed = await this.getRichMenuId(name);
    if (existed) {
      throw new Error(`rich menu [ ${name} ] already exist`);
    }

    const {
      results: [{ richMenuId }],
    } = await this._bot.dispatchAPICall('POST', PATH_RICHMENU, body);

    await this.setAssetId(RICH_MENU, name, richMenuId);
    return richMenuId;
  }

  async deleteRichMenu(name: string): Promise<string> {
    const id = await this.getRichMenuId(name);
    if (id === undefined) {
      throw new Error(`rich menu [ ${name} ] not exist`);
    }

    await this._bot.dispatchAPICall('DELETE', `${PATH_RICHMENU}/${id}`);

    await this.removeAssetId(RICH_MENU, name);
    return id;
  }
}

export default provider<LineAssetsManager>({
  lifetime: 'scoped',
  deps: [StateControllerI, LineBot],
})(LineAssetsManager);
