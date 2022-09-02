import type { SociablyNode } from '@sociably/core';
import { makeClassProvider } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import { PATH_PERSONAS, FACEBOOK } from '../constant';

import BotP from '../Bot';

const ATTACHMENT = 'attachment';
const PERSONA = 'persona';

/**
 * FacebookAssetsManager stores name-to-id mapping for assets created in
 * Facebook platform.
 * @category Provider
 */
export class FacebookAssetsManager {
  bot: BotP;
  pageId: string;
  _stateController: StateControllerI;

  constructor(stateManager: StateControllerI, bot: BotP) {
    this._stateController = stateManager;
    this.bot = bot;
    this.pageId = bot.pageId;
  }

  private _makeResourceToken(resource: string): string {
    return `${FACEBOOK}.assets.${this.pageId}.${resource}`;
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

  getAttachment(name: string): Promise<undefined | string> {
    return this.getAssetId(ATTACHMENT, name);
  }

  saveAttachment(name: string, id: string): Promise<boolean> {
    return this.saveAssetId(ATTACHMENT, name, id);
  }

  getAllAttachments(): Promise<null | Map<string, string>> {
    return this.getAllAssets(ATTACHMENT);
  }

  unsaveAttachment(name: string): Promise<boolean> {
    return this.unsaveAssetId(ATTACHMENT, name);
  }

  async renderAttachment(name: string, node: SociablyNode): Promise<string> {
    const existed = await this.getAttachment(name);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${name} ] already exist`);
    }

    const response = await this.bot.renderAttachment(node);
    if (response === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const id = response.results[0].body.attachment_id as string;
    await this.saveAssetId(ATTACHMENT, name, id);
    return id;
  }

  getPersona(name: string): Promise<undefined | string> {
    return this.getAssetId(PERSONA, name);
  }

  getAllPersonas(): Promise<null | Map<string, string>> {
    return this.getAllAssets(PERSONA);
  }

  savePersona(name: string, id: string): Promise<boolean> {
    return this.saveAssetId(PERSONA, name, id);
  }

  unsavePersona(name: string): Promise<boolean> {
    return this.unsaveAssetId(PERSONA, name);
  }

  async createPersona(name: string, body: any): Promise<string> {
    const existed = await this.getPersona(name);
    if (existed !== undefined) {
      throw new Error(`persona [ ${name} ] already exist`);
    }

    const { id: personaId } = await this.bot.makeApiCall<{ id: string }>(
      'POST',
      PATH_PERSONAS,
      body
    );

    await this.saveAssetId(PERSONA, name, personaId);
    return personaId;
  }

  async deletePersona(name: string): Promise<boolean> {
    const id = await this.getPersona(name);
    if (!id) {
      return false;
    }

    await this.bot.makeApiCall('DELETE', id);
    await this.unsavePersona(name);
    return true;
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP],
})(FacebookAssetsManager);

type AssetsManagerP = FacebookAssetsManager;

export default AssetsManagerP;
