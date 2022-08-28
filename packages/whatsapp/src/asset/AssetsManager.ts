import type { SociablyNode } from '@sociably/core';
import { makeClassProvider } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import BotP from '../Bot';
import { WHATSAPP } from '../constant';

const MEDIA = 'media';

/**
 * WhatsAppAssetsManager manage name-to-id mapping for assets in WhatsApp
 * platform.
 * @category Provider
 */
export class WhatsAppAssetsManager {
  bot: BotP;
  _stateController: StateControllerI;

  constructor(stateManager: StateControllerI, bot: BotP) {
    this._stateController = stateManager;
    this.bot = bot;
  }

  private _makeResourceToken(resource: string): string {
    return `${WHATSAPP}.assets.${this.bot.businessNumber}.${resource}`;
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

  getMedia(name: string): Promise<undefined | string> {
    return this.getAssetId(MEDIA, name);
  }

  saveMedia(name: string, id: string): Promise<boolean> {
    return this.saveAssetId(MEDIA, name, id);
  }

  getAllMedias(): Promise<null | Map<string, string>> {
    return this.getAllAssets(MEDIA);
  }

  unsaveMedia(name: string): Promise<boolean> {
    return this.unsaveAssetId(MEDIA, name);
  }

  async uploadMedia(name: string, node: SociablyNode): Promise<string> {
    const existed = await this.getMedia(name);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${name} ] already exist`);
    }

    const result = await this.bot.uploadMedia(node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const id = result.id as string;
    await this.saveMedia(name, id);
    return id;
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP],
})(WhatsAppAssetsManager);

type AssetsManagerP = WhatsAppAssetsManager;

export default AssetsManagerP;
