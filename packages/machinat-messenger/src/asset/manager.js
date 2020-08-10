// @flow
import { provider } from '@machinat/core/service';
import type { MachinatNode } from '@machinat/core/types';
import { StateControllerI } from '@machinat/core/base';
import formatNode from '@machinat/core/utils/formatNode';
import { PATH_PERSONAS } from '../constant';
import MessengerBot from '../bot';

const ATTACHMENT = 'attachment';
const PERSONA = 'persona';

class MessengerAssetsManager {
  bot: MessengerBot;
  pageId: string;
  _stateController: StateControllerI;

  constructor(stateManager: StateControllerI, bot: MessengerBot) {
    this._stateController = stateManager;
    this.bot = bot;
    this.pageId = bot.pageId;
  }

  _makeResourceToken(resource: string) {
    return `messenger.assets.${this.pageId}.${resource}`;
  }

  async getAssetId(resource: string, name: string): Promise<void | string> {
    const existed = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .get(name);
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

  setAttachmentId(name: string, id: string) {
    return this.setAssetId(ATTACHMENT, name, id);
  }

  getAllAttachments() {
    return this.getAllAssets(ATTACHMENT);
  }

  removeAttachmentId(name: string) {
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
    return (this.getAssetId(PERSONA, name): any);
  }

  setPersonaId(name: string, id: string) {
    return this.setAssetId(PERSONA, name, id);
  }

  getAllPersonas() {
    return this.getAllAssets(PERSONA);
  }

  removePersonaId(name: string) {
    return this.removeAssetId(PERSONA, name);
  }

  async createPersona(name: string, body: Object): Promise<string> {
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

export default provider<MessengerAssetsManager>({
  lifetime: 'scoped',
  deps: [StateControllerI, MessengerBot],
})(MessengerAssetsManager);