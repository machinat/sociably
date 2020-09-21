import { provider } from '@machinat/core/service';
import { BaseStateControllerI } from '@machinat/core/base';
import { BotP } from '../bot';

/** @ignore */
const FILE = 'file';

/**
 * TelegramAssetsManager stores name-to-id mapping for assets created in
 * Telegram platform.
 * @category Provider
 */
export class TelegramAssetsManager {
  bot: BotP;
  botId: number;
  _stateController: BaseStateControllerI;

  constructor(stateManager: BaseStateControllerI, bot: BotP) {
    this._stateController = stateManager;
    this.bot = bot;
    this.botId = bot.botId;
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

  getFileId(name: string): Promise<void | string> {
    return this.getAssetId(FILE, name);
  }

  setFileId(name: string, id: string): Promise<void> {
    return this.setAssetId(FILE, name, id);
  }

  getAllFiles(): Promise<null | Map<string, string>> {
    return this.getAllAssets(FILE);
  }

  removeFileId(name: string): Promise<void> {
    return this.removeAssetId(FILE, name);
  }
}

export const AssetsManagerP = provider<TelegramAssetsManager>({
  lifetime: 'scoped',
  deps: [BaseStateControllerI, BotP],
})(TelegramAssetsManager);

export type AssetsManagerP = TelegramAssetsManager;
