// @flow
import { provider } from '@machinat/core/service';
import type { MachinatNode } from '@machinat/core/types';
import { StateControllerI } from '@machinat/core/base';
import formatNode from '@machinat/core/utils/formatNode';
import { PATH_PERSONAS } from '../constant';
import MessengerBot from '../bot';

const ATTACHMENT = 'attachment';
const PERSONA = 'persona';

class MessengerAssetsRegistry {
  bot: MessengerBot;
  pageId: string;
  _stateController: StateControllerI;

  constructor(stateManager: StateControllerI, bot: MessengerBot) {
    this._stateController = stateManager;
    this.bot = bot;
    this.pageId = bot.pageId;
  }

  _makeResourceToken(resource: string) {
    return `messenger.assets:${this.pageId}:${resource}`;
  }

  async getAssetId(resource: string, tag: string): Promise<void | string> {
    const existed = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .get(tag);
    return existed || undefined;
  }

  async setAssetId(resource: string, tag: string, id: string): Promise<void> {
    await this._stateController
      .globalState(this._makeResourceToken(resource))
      .set<string>(tag, (existed) => {
        if (existed) {
          throw new Error(`${resource} [ ${tag} ] already exist`);
        }
        return id;
      });
  }

  getAllAssets(resource: string): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(this._makeResourceToken(resource))
      .getAll();
  }

  async removeAssetId(resource: string, tag: string): Promise<void> {
    const isDeleted = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .delete(tag);

    if (!isDeleted) {
      throw new Error(`${resource} [ ${tag} ] not exist`);
    }
  }

  getAttachmentId(tag: string): Promise<void | string> {
    return this.getAssetId(ATTACHMENT, tag);
  }

  setAttachmentId(tag: string, id: string) {
    return this.setAssetId(ATTACHMENT, tag, id);
  }

  getAllAttachments() {
    return this.getAllAssets(ATTACHMENT);
  }

  removeAttachmentId(tag: string) {
    return this.removeAssetId(ATTACHMENT, tag);
  }

  async renderAttachment(tag: string, node: MachinatNode): Promise<string> {
    const existed = await this.getAttachmentId(tag);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${tag} ] already exist`);
    }

    const response = await this.bot.renderAttachment(node);
    if (response === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachment_id: id } = response.results[0].body;
    await this.setAssetId(ATTACHMENT, tag, id);
    return id;
  }

  getPersonaId(tag: string): Promise<void | string> {
    return (this.getAssetId(PERSONA, tag): any);
  }

  setPersonaId(tag: string, id: string) {
    return this.setAssetId(PERSONA, tag, id);
  }

  getAllPersonas() {
    return this.getAllAssets(PERSONA);
  }

  removePersonaId(tag: string) {
    return this.removeAssetId(PERSONA, tag);
  }

  async createPersona(tag: string, body: Object): Promise<string> {
    const existed = await this.getPersonaId(tag);
    if (existed !== undefined) {
      throw new Error(`persona [ ${tag} ] already exist`);
    }

    const response = await this.bot.dispatchAPICall(
      'POST',
      PATH_PERSONAS,
      body
    );
    const { id } = response.results[0].body;

    await this.setAssetId(PERSONA, tag, id);
    return id;
  }

  async deletePersona(tag: string): Promise<string> {
    const id = await this.getPersonaId(tag);
    if (id === undefined) {
      throw new Error(`persona [ ${tag} ] not exist`);
    }

    await this.bot.dispatchAPICall('DELETE', id);
    return id;
  }
}

export default provider<MessengerAssetsRegistry>({
  lifetime: 'scoped',
  deps: [StateControllerI, MessengerBot],
})(MessengerAssetsRegistry);
