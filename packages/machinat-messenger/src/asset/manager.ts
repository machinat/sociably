import { provider } from '@machinat/core/service';
import type { MachinatNode } from '@machinat/core/types';
import { BaseStateControllerI } from '@machinat/core/base';
import formatNode from '@machinat/core/utils/formatNode';
import { PATH_PERSONAS } from '../constant';
import { BotP } from '../bot';

/** @ignore */
const ATTACHMENT = 'attachment';

/** @ignore */
const PERSONA = 'persona';

/**
 * MessengerAssetsManager stores name-to-id mapping for assets created in
 * Messenger platform.
 * @category Provider
 */
export class MessengerAssetsManager {
  bot: BotP;
  pageId: string;
  _stateController: BaseStateControllerI;

  constructor(stateManager: BaseStateControllerI, bot: BotP) {
    this._stateController = stateManager;
    this.bot = bot;
    this.pageId = bot.pageId;
  }

  private _makeResourceToken(resource: string): string {
    return `messenger.assets.${this.pageId}.${resource}`;
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

  getAttachmentId(name: string): Promise<void | string> {
    return this.getAssetId(ATTACHMENT, name);
  }

  setAttachmentId(name: string, id: string): Promise<void> {
    return this.setAssetId(ATTACHMENT, name, id);
  }

  getAllAttachments(): Promise<null | Map<string, string>> {
    return this.getAllAssets(ATTACHMENT);
  }

  removeAttachmentId(name: string): Promise<void> {
    return this.removeAssetId(ATTACHMENT, name);
  }

  async renderAttachment(name: string, node: MachinatNode): Promise<string> {
    const existed = await this.getAttachmentId(name);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${name} ] already exist`);
    }

    const response = await this.bot.renderAttachment(node);
    if (response === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachment_id: id } = response.results[0].body;
    await this.setAssetId(ATTACHMENT, name, id);
    return id;
  }

  getPersonaId(name: string): Promise<void | string> {
    return this.getAssetId(PERSONA, name);
  }

  setPersonaId(name: string, id: string): Promise<void> {
    return this.setAssetId(PERSONA, name, id);
  }

  getAllPersonas(): Promise<null | Map<string, string>> {
    return this.getAllAssets(PERSONA);
  }

  removePersonaId(name: string): Promise<void> {
    return this.removeAssetId(PERSONA, name);
  }

  async createPersona(name: string, body: any): Promise<string> {
    const existed = await this.getPersonaId(name);
    if (existed !== undefined) {
      throw new Error(`persona [ ${name} ] already exist`);
    }

    const response = await this.bot.dispatchAPICall(
      'POST',
      PATH_PERSONAS,
      body
    );
    const { id } = response.results[0].body;

    await this.setAssetId(PERSONA, name, id);
    return id;
  }

  async deletePersona(name: string): Promise<string> {
    const id = await this.getPersonaId(name);
    if (id === undefined) {
      throw new Error(`persona [ ${name} ] not exist`);
    }

    await this.bot.dispatchAPICall('DELETE', id);
    return id;
  }
}

export const AssetsManagerP = provider<MessengerAssetsManager>({
  lifetime: 'scoped',
  deps: [BaseStateControllerI, BotP],
})(MessengerAssetsManager);

export type AssetsManagerP = MessengerAssetsManager;
