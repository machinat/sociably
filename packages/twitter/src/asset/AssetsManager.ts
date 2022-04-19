import { MachinatNode } from '@machinat/core';
import { makeClassProvider } from '@machinat/core/service';
import StateControllerI from '@machinat/core/base/StateController';
import { ConfigsI } from '../interface';
import BotP from '../Bot';
import { RenderMediaResponse } from '../types';

const MEDIA = 'media';
const WEBHOOK = 'webhook';
const WELCOME_MESSAGE = 'welcome_message';
const CUSTOM_PROFILE = 'custom_profile';

/**
 * TwitterAssetsManager stores ids of assets created at Twitter platform.
 * @category Provider
 */
export class TwitterAssetsManager {
  bot: BotP;
  appId: string;
  _stateController: StateControllerI;

  constructor(appId: string, stateManager: StateControllerI, bot: BotP) {
    this._stateController = stateManager;
    this.appId = appId;
    this.bot = bot;
  }

  private _makeResourceToken(resource: string): string {
    return `twitter.assets.${this.appId}.${resource}`;
  }

  async getAssetId(resource: string, tag: string): Promise<undefined | string> {
    const existed = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .get<string>(tag);
    return existed || undefined;
  }

  async saveAssetId(
    resource: string,
    tag: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .set<string>(tag, id);
    return isUpdated;
  }

  getAllAssets(resource: string): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(this._makeResourceToken(resource))
      .getAll();
  }

  async unsaveAssetId(resource: string, tag: string): Promise<boolean> {
    const isDeleted = await this._stateController
      .globalState(this._makeResourceToken(resource))
      .delete(tag);

    return isDeleted;
  }

  // media
  getMedia(tag: string): Promise<undefined | string> {
    return this.getAssetId(MEDIA, tag);
  }

  saveMedia(tag: string, id: string): Promise<boolean> {
    return this.saveAssetId(MEDIA, tag, id);
  }

  getAllMedia(): Promise<null | Map<string, string>> {
    return this.getAllAssets(MEDIA);
  }

  unsaveMedia(tag: string): Promise<boolean> {
    return this.unsaveAssetId(MEDIA, tag);
  }

  async renderMedia(
    tag: string,
    media: MachinatNode
  ): Promise<RenderMediaResponse> {
    const results = await this.bot.renderMedia(media);
    if (!results) {
      throw new Error('media content is empty');
    }

    const result = results[0];
    this.saveMedia(tag, result.id);

    return result;
  }

  // webhook
  getWebhook(tag: string): Promise<undefined | string> {
    return this.getAssetId(WEBHOOK, tag);
  }

  saveWebhook(tag: string, id: string): Promise<boolean> {
    return this.saveAssetId(WEBHOOK, tag, id);
  }

  getAllWebhooks(): Promise<null | Map<string, string>> {
    return this.getAllAssets(WEBHOOK);
  }

  unsaveWebhook(tag: string): Promise<boolean> {
    return this.unsaveAssetId(WEBHOOK, tag);
  }

  async setUpWebhook(
    tag: string,
    envName: string,
    url: string
  ): Promise<string> {
    const savedId = await this.getWebhook(tag);
    if (savedId) {
      return savedId;
    }

    const { environments } = await this.bot.makeApiCall(
      'GET',
      `1.1/account_activity/all/webhooks.json`,
      undefined,
      { asApplication: true }
    );

    const environment = environments.find(
      ({ environment_name: name }) => name === envName
    );
    const existedWebhook = environment?.webhooks.find(
      ({ url: webhookUrl }) => webhookUrl === url
    );

    if (existedWebhook) {
      await this.saveWebhook(tag, existedWebhook.id);
      return existedWebhook.id;
    }

    const { id: newWebhookId } = await this.bot.makeApiCall(
      'POST',
      `1.1/account_activity/all/${envName}/webhooks.json`,
      { url }
    );
    await this.saveWebhook(tag, newWebhookId);
    return newWebhookId;
  }

  async deleteWebhook(tag: string, envName: string): Promise<string> {
    const webhookId = await this.getWebhook(tag);
    if (!webhookId) {
      throw new Error(`webhook "${tag}" doesn't exist`);
    }

    await this.bot.makeApiCall(
      'DELETE',
      `1.1/account_activity/all/${envName}/webhooks/${webhookId}.json`
    );
    await this.unsaveWebhook(tag);
    return webhookId;
  }

  // welcome message
  getWelcomeMessage(tag: string): Promise<undefined | string> {
    return this.getAssetId(WELCOME_MESSAGE, tag);
  }

  saveWelcomeMessage(tag: string, id: string): Promise<boolean> {
    return this.saveAssetId(WELCOME_MESSAGE, tag, id);
  }

  getAllWelcomeMessages(): Promise<null | Map<string, string>> {
    return this.getAllAssets(WELCOME_MESSAGE);
  }

  unsaveWelcomeMessage(tag: string): Promise<boolean> {
    return this.unsaveAssetId(WELCOME_MESSAGE, tag);
  }

  // custome profile
  getCustomProfile(tag: string): Promise<undefined | string> {
    return this.getAssetId(CUSTOM_PROFILE, tag);
  }

  saveCustomProfile(tag: string, id: string): Promise<boolean> {
    return this.saveAssetId(CUSTOM_PROFILE, tag, id);
  }

  getAllCustomProfiles(): Promise<null | Map<string, string>> {
    return this.getAllAssets(CUSTOM_PROFILE);
  }

  unsaveCustomProfile(tag: string): Promise<boolean> {
    return this.unsaveAssetId(CUSTOM_PROFILE, tag);
  }

  async createCustomProfile(
    tag: string,
    name: string,
    mediaId: string
  ): Promise<string> {
    const existedId = await this.getCustomProfile(tag);
    if (existedId) {
      throw new Error(`custom profile [${tag}] already exists`);
    }

    const {
      custom_profile: { id: customProfileId },
    } = await this.bot.makeApiCall('POST', `1.1/custom_profiles/new.json`, {
      custom_profile: {
        name,
        avatar: { media: { id: mediaId } },
      },
    });

    await this.saveCustomProfile(tag, customProfileId);
    return customProfileId;
  }

  async deleteCustomProfile(tag: string): Promise<string> {
    const customProfileId = await this.getCustomProfile(tag);
    if (!customProfileId) {
      throw new Error(`custom profile [${tag}] doesn't exist`);
    }

    await this.bot.makeApiCall('DELETE', '1.1/custom_profiles/destroy.json', {
      id: customProfileId,
    });
    await this.unsaveCustomProfile(tag);
    return customProfileId;
  }
}

const AssetsManagerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [ConfigsI, StateControllerI, BotP],
  factory: ({ appId }, stateController, bot) =>
    new TwitterAssetsManager(appId, stateController, bot),
})(TwitterAssetsManager);

type AssetsManagerP = TwitterAssetsManager;

export default AssetsManagerP;
