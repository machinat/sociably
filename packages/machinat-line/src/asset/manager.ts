import { provider } from '@machinat/core/service';
import Base from '@machinat/core/base';
import { BotP } from '../bot';
import { PATH_RICHMENU } from '../constant';

/** @ignore */
const LIFF = 'liff';

/** @ignore */
const RICH_MENU = 'rich_menu';

/**
 * @category Provider
 */
export class LineAssetsManager {
  botChannelId: string;
  private _stateController: Base.StateControllerI;
  private _bot: BotP;

  constructor(stateMaanger: Base.StateControllerI, bot: BotP) {
    this.botChannelId = bot.botChannelId;
    this._stateController = stateMaanger;
    this._bot = bot;
  }

  private _makeResourceToken(resource: string) {
    return `line.assets.${this.botChannelId}.${resource}`;
  }

  async getAssetId(
    resource: string,
    name: string
  ): Promise<undefined | string> {
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

  setLIFFAppId(name: string, id: string): Promise<void> {
    return this.setAssetId(LIFF, name, id);
  }

  getAllLIFFApps(): Promise<null | Map<string, string>> {
    return this.getAllAssets(LIFF);
  }

  removeLIFFAppId(name: string): Promise<void> {
    return this.removeAssetId(LIFF, name);
  }

  getRichMenuId(name: string): Promise<undefined | string> {
    return this.getAssetId(RICH_MENU, name);
  }

  setRichMenuId(name: string, id: string): Promise<void> {
    return this.setAssetId(RICH_MENU, name, id);
  }

  getAllRichMenus(): Promise<null | Map<string, string>> {
    return this.getAllAssets(RICH_MENU);
  }

  removeRichMenuId(name: string): Promise<void> {
    return this.removeAssetId(RICH_MENU, name);
  }

  async createRichMenu(name: string, body: any): Promise<string> {
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

    await this._bot.dispatchAPICall('DELETE', `${PATH_RICHMENU}/${id}`, null);

    await this.removeAssetId(RICH_MENU, name);
    return id;
  }
}

export const AssetsManagerP = provider<LineAssetsManager>({
  lifetime: 'scoped',
  deps: [Base.StateControllerI, BotP],
})(LineAssetsManager);

export type AssetsManagerP = LineAssetsManager;
