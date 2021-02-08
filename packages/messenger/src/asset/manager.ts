import { makeClassProvider } from '@machinat/core/service';
import type { MachinatNode } from '@machinat/core/types';
import StateControllerI from '@machinat/core/base/StateController';
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
  _stateController: StateControllerI;

  constructor(stateManager: StateControllerI, bot: BotP) {
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

  getAttachment(name: string): Promise<void | string> {
    return this.getAssetId(ATTACHMENT, name);
  }

  saveAttachment(name: string, id: string): Promise<void> {
    return this.saveAssetId(ATTACHMENT, name, id);
  }

  getAllAttachments(): Promise<null | Map<string, string>> {
    return this.getAllAssets(ATTACHMENT);
  }

  discardAttachment(name: string): Promise<void> {
    return this.discardAssetId(ATTACHMENT, name);
  }

  async renderAttachment(name: string, node: MachinatNode): Promise<string> {
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

  getPersona(name: string): Promise<void | string> {
    return this.getAssetId(PERSONA, name);
  }

  savePersona(name: string, id: string): Promise<void> {
    return this.saveAssetId(PERSONA, name, id);
  }

  getAllPersonas(): Promise<null | Map<string, string>> {
    return this.getAllAssets(PERSONA);
  }

  discardPersona(name: string): Promise<void> {
    return this.discardAssetId(PERSONA, name);
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

  async deletePersona(name: string): Promise<string> {
    const id = await this.getPersona(name);
    if (id === undefined) {
      throw new Error(`persona [ ${name} ] not exist`);
    }

    await this.bot.makeApiCall('DELETE', id);
    return id;
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP] as const,
})(MessengerAssetsManager);

type AssetsManagerP = MessengerAssetsManager;

export default AssetsManagerP;
