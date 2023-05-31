import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import TelegramUser from '../User.js';
import { TG } from '../constant.js';

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
    agent: number | TelegramUser,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const agentId = typeof agent === 'number' ? agent : agent.id;
    const existed = await this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    agent: number | TelegramUser,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const agentId = typeof agent === 'number' ? agent : agent.id;
    const isUpdated = await this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    agent: number | TelegramUser,
    resource: string
  ): Promise<null | Map<string, string>> {
    const agentId = typeof agent === 'number' ? agent : agent.id;
    return this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .getAll();
  }

  async unsaveAssetId(
    agent: number | TelegramUser,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const agentId = typeof agent === 'number' ? agent : agent.id;

    const isDeleted = await this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .delete(assetTag);
    return isDeleted;
  }

  getFile(
    agent: number | TelegramUser,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, FILE, assetTag);
  }

  saveFile(
    agent: number | TelegramUser,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, FILE, assetTag, id);
  }

  getAllFiles(
    agent: number | TelegramUser
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, FILE);
  }

  unsaveFile(agent: number | TelegramUser, assetTag: string): Promise<boolean> {
    return this.unsaveAssetId(agent, FILE, assetTag);
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI],
})(TelegramAssetsManager);

type AssetsManagerP = TelegramAssetsManager;

export default AssetsManagerP;
