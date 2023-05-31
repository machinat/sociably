import type { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import BotP from '../Bot.js';
import WhatsAppAgent from '../Agent.js';
import { WA } from '../constant.js';

const MEDIA = 'media';

const makeResourceToken = (numberId: string, resource: string): string =>
  `$${WA}.${resource}.${numberId}`;

/**
 * WhatsAppAssetsManager manage name-to-id mapping for assets in WhatsApp
 * platform.
 * @category Provider
 */
export class WhatsAppAssetsManager {
  private _bot: BotP;
  private _stateController: StateControllerI;

  constructor(bot: BotP, stateController: StateControllerI) {
    this._bot = bot;
    this._stateController = stateController;
  }

  async getAssetId(
    agent: string | WhatsAppAgent,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    const existed = await this._stateController
      .globalState(makeResourceToken(numberId, resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    agent: string | WhatsAppAgent,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    const isUpdated = await this._stateController
      .globalState(makeResourceToken(numberId, resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    agent: string | WhatsAppAgent,
    resource: string
  ): Promise<null | Map<string, string>> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    return this._stateController
      .globalState(makeResourceToken(numberId, resource))
      .getAll();
  }

  async unsaveAssetId(
    agent: string | WhatsAppAgent,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    const isDeleted = await this._stateController
      .globalState(makeResourceToken(numberId, resource))
      .delete(assetTag);

    return isDeleted;
  }

  getMedia(
    agent: string | WhatsAppAgent,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, MEDIA, assetTag);
  }

  saveMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, MEDIA, assetTag, id);
  }

  getAllMedias(
    agent: string | WhatsAppAgent
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, MEDIA);
  }

  unsaveMedia(
    agent: string | WhatsAppAgent,
    assetTag: string
  ): Promise<boolean> {
    return this.unsaveAssetId(agent, MEDIA, assetTag);
  }

  async uploadMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
    node: SociablyNode
  ): Promise<string> {
    const result = await this._bot.uploadMedia(agent, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const id = result.id as string;
    await this.saveMedia(agent, assetTag, id);
    return id;
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP, StateControllerI],
})(WhatsAppAssetsManager);

type AssetsManagerP = WhatsAppAssetsManager;

export default AssetsManagerP;
