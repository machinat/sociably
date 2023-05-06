import type { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import BotP from '../Bot';
import WhatsAppAgent from '../Agent';
import { WA } from '../constant';

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
    name: string
  ): Promise<undefined | string> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    const existed = await this._stateController
      .globalState(makeResourceToken(numberId, resource))
      .get<string>(name);
    return existed || undefined;
  }

  async saveAssetId(
    agent: string | WhatsAppAgent,
    resource: string,
    name: string,
    id: string
  ): Promise<boolean> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    const isUpdated = await this._stateController
      .globalState(makeResourceToken(numberId, resource))
      .set<string>(name, id);
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
    name: string
  ): Promise<boolean> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    const isDeleted = await this._stateController
      .globalState(makeResourceToken(numberId, resource))
      .delete(name);

    return isDeleted;
  }

  getMedia(
    agent: string | WhatsAppAgent,
    name: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, MEDIA, name);
  }

  saveMedia(
    agent: string | WhatsAppAgent,
    name: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, MEDIA, name, id);
  }

  getAllMedias(
    agent: string | WhatsAppAgent
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, MEDIA);
  }

  unsaveMedia(agent: string | WhatsAppAgent, name: string): Promise<boolean> {
    return this.unsaveAssetId(agent, MEDIA, name);
  }

  async uploadMedia(
    agent: string | WhatsAppAgent,
    name: string,
    node: SociablyNode
  ): Promise<string> {
    const existed = await this.getMedia(agent, name);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${name} ] already exist`);
    }

    const result = await this._bot.uploadMedia(agent, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const id = result.id as string;
    await this.saveMedia(agent, name, id);
    return id;
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP, StateControllerI],
})(WhatsAppAssetsManager);

type AssetsManagerP = WhatsAppAssetsManager;

export default AssetsManagerP;