import { makeClassProvider } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import LineChannel from '../Channel';
import BotP from '../Bot';
import { PATH_RICHMENU, LINE } from '../constant';

const RICH_MENU = 'rich_menu';

const resourceToken = (channelId: string, resource: string) =>
  `${LINE}.assets.${channelId}.${resource}`;

/**
 * @category Provider
 */
export class LineAssetsManager {
  private _stateController: StateControllerI;
  private _bot: BotP;

  constructor(stateMaanger: StateControllerI, bot: BotP) {
    this._stateController = stateMaanger;
    this._bot = bot;
  }

  async getAssetId(
    channel: LineChannel,
    resource: string,
    name: string
  ): Promise<undefined | string> {
    const existed = await this._stateController
      .globalState(resourceToken(channel.id, resource))
      .get<string>(name);

    return existed || undefined;
  }

  async saveAssetId(
    channel: LineChannel,
    resource: string,
    name: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this._stateController
      .globalState(resourceToken(channel.id, resource))
      .set<string>(name, id);

    return isUpdated;
  }

  getAllAssets(
    channel: LineChannel,
    resource: string
  ): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(resourceToken(channel.id, resource))
      .getAll();
  }

  async unsaveAssetId(
    channel: LineChannel,
    resource: string,
    name: string
  ): Promise<boolean> {
    const isDeleted = await this._stateController
      .globalState(resourceToken(channel.id, resource))
      .delete(name);

    return isDeleted;
  }

  getRichMenu(channel: LineChannel, name: string): Promise<undefined | string> {
    return this.getAssetId(channel, RICH_MENU, name);
  }

  saveRichMenu(
    channel: LineChannel,
    name: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(channel, RICH_MENU, name, id);
  }

  getAllRichMenus(channel: LineChannel): Promise<null | Map<string, string>> {
    return this.getAllAssets(channel, RICH_MENU);
  }

  unsaveRichMenu(channel: LineChannel, name: string): Promise<boolean> {
    return this.unsaveAssetId(channel, RICH_MENU, name);
  }

  async createRichMenu(
    channel: LineChannel,
    name: string,
    params: Record<string, unknown>
  ): Promise<string> {
    const existed = await this.getRichMenu(channel, name);
    if (existed) {
      throw new Error(`rich menu [ ${name} ] already exist`);
    }

    const { richMenuId }: { richMenuId: string } = await this._bot.requestApi({
      method: 'POST',
      url: PATH_RICHMENU,
      params,
      channel,
    });

    await this.saveAssetId(channel, RICH_MENU, name, richMenuId);
    return richMenuId;
  }

  async deleteRichMenu(channel: LineChannel, name: string): Promise<boolean> {
    const id = await this.getRichMenu(channel, name);
    if (id === undefined) {
      return false;
    }

    await this._bot.requestApi({
      method: 'DELETE',
      url: `${PATH_RICHMENU}/${id}`,
      channel,
    });

    await this.unsaveAssetId(channel, RICH_MENU, name);
    return true;
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP],
})(LineAssetsManager);

type AssetsManagerP = LineAssetsManager;

export default AssetsManagerP;
