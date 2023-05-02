import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import TelegramUser from '../User';
import { TG } from '../constant';

const FILE = 'file';

const makeResourceToken = (botId: number, resource: string): string =>
  `$${TG}.${resource}.${botId}`;

/**
 * TelegramAssetsManager stores name-to-id mapping for assets created in
 * Telegram platform.
 * @category Provider
 */
export class TelegramAssetsManager {
  private _stateController: StateControllerI;

  constructor(stateManager: StateControllerI) {
    this._stateController = stateManager;
  }

  async getAssetId(
    bot: TelegramUser,
    resource: string,
    name: string
  ): Promise<undefined | string> {
    const existed = await this._stateController
      .globalState(makeResourceToken(bot.id, resource))
      .get<string>(name);
    return existed || undefined;
  }

  async saveAssetId(
    bot: TelegramUser,
    resource: string,
    name: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this._stateController
      .globalState(makeResourceToken(bot.id, resource))
      .set<string>(name, id);
    return isUpdated;
  }

  getAllAssets(
    bot: TelegramUser,
    resource: string
  ): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(makeResourceToken(bot.id, resource))
      .getAll();
  }

  async unsaveAssetId(
    bot: TelegramUser,
    resource: string,
    name: string
  ): Promise<boolean> {
    const isDeleted = await this._stateController
      .globalState(makeResourceToken(bot.id, resource))
      .delete(name);

    return isDeleted;
  }

  getFile(bot: TelegramUser, name: string): Promise<undefined | string> {
    return this.getAssetId(bot, FILE, name);
  }

  saveFile(bot: TelegramUser, name: string, id: string): Promise<boolean> {
    return this.saveAssetId(bot, FILE, name, id);
  }

  getAllFiles(bot: TelegramUser): Promise<null | Map<string, string>> {
    return this.getAllAssets(bot, FILE);
  }

  unsaveFile(bot: TelegramUser, name: string): Promise<boolean> {
    return this.unsaveAssetId(bot, FILE, name);
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI],
})(TelegramAssetsManager);

type AssetsManagerP = TelegramAssetsManager;

export default AssetsManagerP;
