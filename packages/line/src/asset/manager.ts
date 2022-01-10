import { makeClassProvider } from '@machinat/core/service';
import StateControllerI from '@machinat/core/base/StateController';
import { BotP } from '../bot';
import { PATH_RICHMENU } from '../constant';

const LIFF = 'liff';
const RICH_MENU = 'rich_menu';

/**
 * @category Provider
 */
export class LineAssetsManager {
  botChannelId: string;
  private _stateController: StateControllerI;
  private _bot: BotP;

  constructor(stateMaanger: StateControllerI, bot: BotP) {
    this.botChannelId = bot.channelId;
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

  async saveAssetId(
    resource: string,
    name: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .set<string>(name, id);

    return isUpdated;
  }

  getAllAssets(resource: string): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(this._makeResourceToken(resource))
      .getAll();
  }

  async unsaveAssetId(resource: string, name: string): Promise<boolean> {
    const isDeleted = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .delete(name);

    return isDeleted;
  }

  getLiffApp(name: string): Promise<undefined | string> {
    return this.getAssetId(LIFF, name);
  }

  saveLiffApp(name: string, id: string): Promise<boolean> {
    return this.saveAssetId(LIFF, name, id);
  }

  getAllLiffApps(): Promise<null | Map<string, string>> {
    return this.getAllAssets(LIFF);
  }

  unsaveLiffApp(name: string): Promise<boolean> {
    return this.unsaveAssetId(LIFF, name);
  }

  getRichMenu(name: string): Promise<undefined | string> {
    return this.getAssetId(RICH_MENU, name);
  }

  saveRichMenu(name: string, id: string): Promise<boolean> {
    return this.saveAssetId(RICH_MENU, name, id);
  }

  getAllRichMenus(): Promise<null | Map<string, string>> {
    return this.getAllAssets(RICH_MENU);
  }

  unsaveRichMenu(name: string): Promise<boolean> {
    return this.unsaveAssetId(RICH_MENU, name);
  }

  async createRichMenu(name: string, body: unknown): Promise<string> {
    const existed = await this.getRichMenu(name);
    if (existed) {
      throw new Error(`rich menu [ ${name} ] already exist`);
    }

    const { richMenuId }: { richMenuId: string } = await this._bot.makeApiCall(
      'POST',
      PATH_RICHMENU,
      body
    );

    await this.saveAssetId(RICH_MENU, name, richMenuId);
    return richMenuId;
  }

  async deleteRichMenu(name: string): Promise<boolean> {
    const id = await this.getRichMenu(name);
    if (id === undefined) {
      return false;
    }

    await this._bot.makeApiCall('DELETE', `${PATH_RICHMENU}/${id}`, null);

    await this.unsaveAssetId(RICH_MENU, name);
    return true;
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP] as const,
})(LineAssetsManager);

type AssetsManagerP = LineAssetsManager;

export default AssetsManagerP;
