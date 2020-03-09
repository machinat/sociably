// @flow
import type { MachinatNode } from '@machinat/core/types';
import type {
  AssetsStore,
  AssetsRepository,
} from '@machinat/assets-store/types';

import formatNode from '@machinat/core/utils/formatNode';
import { MESSENGER, PATH_PERSONAS, PATH_CUSTOM_LABELS } from '../constant';
import MessengerBot from '../bot';
import {
  ATTACHMENT,
  CUSTOM_LABEL,
  MESSAGE_CREATIVE,
  PERSONA,
} from './resourceType';

class MessengerAssetsRepository implements AssetsRepository {
  store: AssetsStore;
  bot: MessengerBot;
  pageId: string;

  constructor(store: AssetsStore, bot: MessengerBot) {
    this.store = store;
    this.bot = bot;
    this.pageId = bot.pageId;
  }

  getAsset(resource: string, tag: string) {
    return this.store.get(MESSENGER, this.pageId, resource, tag);
  }

  setAsset(resource: string, tag: string, id: string | number) {
    return this.store.set(MESSENGER, this.pageId, resource, tag, id);
  }

  listAssets(resource: string) {
    return this.store.list(MESSENGER, this.pageId, resource);
  }

  deleteAsset(resource: string, tag: string) {
    return this.store.delete(MESSENGER, this.pageId, resource, tag);
  }

  deleteAssetById(resource: string, id: string) {
    return this.store.deleteById(MESSENGER, this.pageId, resource, id);
  }

  getAttachmentId(tag: string): Promise<void | string> {
    return (this.getAsset(ATTACHMENT, tag): any);
  }

  async renderAttachment(tag: string, node: MachinatNode): Promise<string> {
    const existed = await this.getAttachmentId(tag);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${tag} ] already existed (${existed})`);
    }

    const result = await this.bot.renderAttachment(node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachment_id: id } = result.body;
    await this.setAsset(MESSAGE_CREATIVE, tag, id);
    return id;
  }

  getMessageCreativeId(tag: string): Promise<void | string> {
    return (this.getAsset(MESSAGE_CREATIVE, tag): any);
  }

  async renderMessageCreative(
    tag: string,
    node: MachinatNode
  ): Promise<string> {
    const existed = await this.getMessageCreativeId(tag);
    if (existed !== undefined) {
      throw new Error(
        `message creative [ ${tag} ] already existed (${existed})`
      );
    }

    const result = await this.bot.renderMessageCreative(node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { message_creative_id: id } = result.body;
    await this.setAsset(MESSAGE_CREATIVE, tag, id);
    return id;
  }

  getCustomLabelId(tag: string): Promise<void | string> {
    return (this.getAsset(CUSTOM_LABEL, tag): any);
  }

  async createCustomLabel(tag: string, body: Object): Promise<string> {
    const existed = await this.getCustomLabelId(tag);
    if (existed !== undefined) {
      throw new Error(`custom label [ ${tag} ] already existed (${existed})`);
    }

    const {
      body: { id },
    } = await this.bot.dispatchAPICall('POST', PATH_CUSTOM_LABELS, body);

    await this.setAsset(CUSTOM_LABEL, tag, id);
    return id;
  }

  async deleteCustomLabel(tag: string): Promise<string> {
    const id = await this.getCustomLabelId(tag);
    if (id === undefined) {
      throw new Error(`custom label [ ${tag} ] not existed`);
    }

    await this.bot.dispatchAPICall('DELETE', id);
    return id;
  }

  getPersonaId(tag: string): Promise<void | string> {
    return (this.getAsset(PERSONA, tag): any);
  }

  async createPersona(tag: string, body: Object): Promise<string> {
    const existed = await this.getPersonaId(tag);
    if (existed !== undefined) {
      throw new Error(`persona [ ${tag} ] already existed (${existed})`);
    }

    const {
      body: { id },
    } = await this.bot.dispatchAPICall('POST', PATH_PERSONAS, body);

    await this.setAsset(PERSONA, tag, id);
    return id;
  }

  async deletePersona(tag: string): Promise<string> {
    const id = await this.getPersonaId(tag);
    if (id === undefined) {
      throw new Error(`persona [ ${tag} ] not existed`);
    }

    await this.bot.dispatchAPICall('DELETE', id);
    return id;
  }
}

export default MessengerAssetsRepository;
