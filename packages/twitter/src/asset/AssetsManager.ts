import { makeClassProvider } from '@machinat/core/service';
import StateControllerI from '@machinat/core/base/StateController';
import { ConfigsI } from '../interface';
import BotP from '../Bot';

const MEDIA = 'media';
const WEBHOOK = 'webhook';

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

  getAllMedia(): Promise<null | Map<string, string>> {
    return this.getAllAssets(MEDIA);
  }

  unsaveMedia(name: string): Promise<boolean> {
    return this.unsaveAssetId(MEDIA, name);
  }

  getWebhook(name: string): Promise<undefined | string> {
    return this.getAssetId(WEBHOOK, name);
  }

  saveWebhook(name: string, id: string): Promise<boolean> {
    return this.saveAssetId(WEBHOOK, name, id);
  }

  getAllWebhooks(): Promise<null | Map<string, string>> {
    return this.getAllAssets(WEBHOOK);
  }

  unsaveWebhook(name: string): Promise<boolean> {
    return this.unsaveAssetId(WEBHOOK, name);
  }

  async createWebhook(
    envName: string,
    webhookName: string,
    url: string
  ): Promise<string> {
    const existedId = await this.getWebhook(webhookName);
    if (existedId) {
      throw new Error(`webhook "${webhookName}" already exists`);
    }

    const { id: webhookId } = await this.bot.makeApiCall(
      'POST',
      `1.1/account_activity/all/${envName}/webhooks.json`,
      { url }
    );
    await this.saveWebhook(webhookName, webhookId);
    return webhookId;
  }

  async removeWebhook(envName: string, webhookName: string): Promise<string> {
    const webhookId = await this.getWebhook(webhookName);
    if (!webhookId) {
      throw new Error(`webhook "${webhookName}" doesn't exist`);
    }

    await this.bot.makeApiCall(
      'DELETE',
      `1.1/account_activity/all/${envName}/webhooks/${webhookId}.json`
    );
    await this.unsaveWebhook(webhookName);
    return webhookId;
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
