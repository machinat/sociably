// @flow
import type { MachinatNode } from 'machinat/types';
import type {
  AssetStore,
  ScopedAssetAccessor,
} from 'machinat-asset-store/types';
import { MESSENGER, PATH_PERSONAS, PATH_CUSTOM_LABELS } from '../constant';
import MessengerBot from '../bot';
import {
  ATTACHMENT,
  CUSTOM_LABEL,
  MESSAGE_CREATIVE,
  PERSONA,
} from './resourceType';

class MessengerAssetManager implements ScopedAssetAccessor {
  store: AssetStore;
  bot: MessengerBot;
  pageId: string;

  constructor(store: AssetStore, bot: MessengerBot) {
    this.store = store;
    this.bot = bot;
    this.pageId = bot.options.pageId;
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

  async createAttachment(tag: string, node: MachinatNode): Promise<string> {
    const existed = await this.getAttachmentId(tag);
    if (existed !== undefined) {
      throw new Error();
    }

    const result = await this.bot.createAttachment(node);
    if (result === null) {
      throw new Error();
    }

    const { attachment_id: id } = result.body;
    await this.setAsset(MESSAGE_CREATIVE, tag, id);
    return id;
  }

  getMessageCreativeId(tag: string): Promise<void | string> {
    return (this.getAsset(MESSAGE_CREATIVE, tag): any);
  }

  async createMessageCreative(
    tag: string,
    node: MachinatNode
  ): Promise<string> {
    const existed = await this.getMessageCreativeId(tag);
    if (existed !== undefined) {
      throw new Error();
    }

    const result = await this.bot.createMessageCreative(node);
    if (result === null) {
      throw new Error();
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
      throw new Error();
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
      throw new Error();
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
      throw new Error();
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
      throw new Error();
    }

    await this.bot.dispatchAPICall('DELETE', id);
    return id;
  }
}

export default MessengerAssetManager;
