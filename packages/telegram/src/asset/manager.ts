import { makeClassProvider } from '@machinat/core/service';
import StateControllerI from '@machinat/core/base/StateController';
import { BotP } from '../bot';

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

  async saveAssetId(resource: string, name: string, id: string): Promise<void> {
    await this._stateController
      .globalState(this._makeResourceToken(resource))
      .update<string>(name, (existed) => {
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

  async discardAssetId(resource: string, name: string): Promise<void> {
    const isDeleted = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .delete(name);

    if (!isDeleted) {
      throw new Error(`${resource} [ ${name} ] not exist`);
    }
  }

  getFileId(name: string): Promise<void | string> {
    return this.getAssetId(FILE, name);
  }

  saveFile(name: string, id: string): Promise<void> {
    return this.saveAssetId(FILE, name, id);
  }

  getAllFiles(): Promise<null | Map<string, string>> {
    return this.getAllAssets(FILE);
  }

  discardFile(name: string): Promise<void> {
    return this.discardAssetId(FILE, name);
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP] as const,
})(TelegramAssetsManager);

type AssetsManagerP = TelegramAssetsManager;

export default AssetsManagerP;
