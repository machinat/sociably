import { makeClassProvider } from '@machinat/core/service';
import StateControllerI from '@machinat/core/base/StateController';
import BotP from '../Bot';

const FILE = 'file';

/**
 * TelegramAssetsManager stores name-to-id mapping for assets created in
 * Telegram platform.
 * @category Provider
 */
export class TelegramAssetsManager {
  bot: BotP;
  botId: number;
  _stateController: StateControllerI;

  constructor(stateManager: StateControllerI, bot: BotP) {
    this._stateController = stateManager;
    this.bot = bot;
    this.botId = bot.id;
  }

  private _makeResourceToken(resource: string): string {
    return `telegram.assets.${this.botId}.${resource}`;
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

  getFile(name: string): Promise<undefined | string> {
    return this.getAssetId(FILE, name);
  }

  saveFile(name: string, id: string): Promise<boolean> {
    return this.saveAssetId(FILE, name, id);
  }

  getAllFiles(): Promise<null | Map<string, string>> {
    return this.getAllAssets(FILE);
  }

  unsaveFile(name: string): Promise<boolean> {
    return this.unsaveAssetId(FILE, name);
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP] as const,
})(TelegramAssetsManager);

type AssetsManagerP = TelegramAssetsManager;

export default AssetsManagerP;
