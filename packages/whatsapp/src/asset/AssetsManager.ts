import type { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import Http from '@sociably/http';
import {
  MetaAssetsManager,
  SetMetaAppSubscriptionOptions,
  DeleteMetaAppSubscriptionOptions,
} from '@sociably/meta-api';
import BotP from '../Bot.js';
import WhatsAppAgent from '../Agent.js';
import { ConfigsI } from '../interface.js';
import { WA } from '../constant.js';

const MEDIA = 'media';

export type DefaultSettings = {
  appId?: string;
  webhookVerifyToken?: string;
  subscriptionFields?: string[];
  webhookUrl?: string;
};

const DEFAULT_SUBSCRIPTION_FIELDS = ['messages'];

/**
 * WhatsAppAssetsManager manage name-to-id mapping for assets in WhatsApp
 * platform.
 * @category Provider
 */
export class WhatsAppAssetsManager extends MetaAssetsManager {
  protected bot: BotP;
  defaultSettings: DefaultSettings;

  constructor(
    stateController: StateControllerI,
    bot: BotP,
    defaultSettings: DefaultSettings = {}
  ) {
    super(stateController, bot, WA);
    this.defaultSettings = {
      ...defaultSettings,
      subscriptionFields:
        defaultSettings.subscriptionFields ?? DEFAULT_SUBSCRIPTION_FIELDS,
    };
  }

  /**
   * Set webhook subscription of an app. Check https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge/
   * for references
   */
  async setAppSubscription({
    objectType = 'whatsapp_business_account',
    appId = this.defaultSettings.appId,
    webhookUrl = this.defaultSettings.webhookUrl,
    fields = this.defaultSettings.subscriptionFields,
    webhookVerifyToken = this.defaultSettings.webhookVerifyToken,
  }: Partial<SetMetaAppSubscriptionOptions> = {}): Promise<void> {
    if (!appId || !webhookVerifyToken || !webhookUrl || !fields?.length) {
      throw new Error(
        'appId, webhookUrl, webhookVerifyToken or fields is empty'
      );
    }
    return super.setAppSubscription({
      appId,
      objectType,
      webhookUrl,
      webhookVerifyToken,
      fields,
    });
  }

  async deleteAppSubscription({
    appId = this.defaultSettings.appId,
    objectType,
    fields,
  }: Partial<DeleteMetaAppSubscriptionOptions> = {}): Promise<void> {
    if (!appId) {
      throw new Error('appId is empty');
    }
    return super.deleteAppSubscription({ appId, objectType, fields });
  }

  getAssetId(
    agent: string | WhatsAppAgent,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    return super.getAssetId(numberId, resource, assetTag);
  }

  saveAssetId(
    agent: string | WhatsAppAgent,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    return super.saveAssetId(numberId, resource, assetTag, id);
  }

  getAllAssets(
    agent: string | WhatsAppAgent,
    resource: string
  ): Promise<null | Map<string, string>> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    return super.getAllAssets(numberId, resource);
  }

  unsaveAssetId(
    agent: string | WhatsAppAgent,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const numberId = typeof agent === 'string' ? agent : agent.numberId;
    return super.unsaveAssetId(numberId, resource, assetTag);
  }

  getMedia(
    agent: string | WhatsAppAgent,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, MEDIA, assetTag);
  }

  saveMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, MEDIA, assetTag, id);
  }

  getAllMedias(
    agent: string | WhatsAppAgent
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, MEDIA);
  }

  unsaveMedia(
    agent: string | WhatsAppAgent,
    assetTag: string
  ): Promise<boolean> {
    return this.unsaveAssetId(agent, MEDIA, assetTag);
  }

  async uploadMedia(
    agent: string | WhatsAppAgent,
    assetTag: string,
    node: SociablyNode
  ): Promise<string> {
    const result = await this.bot.uploadMedia(agent, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { id } = result;
    await this.saveMedia(agent, assetTag, id);
    return id;
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP, Http.Connector, ConfigsI],
  factory: (
    stateController,
    bot,
    connector,
    { appId, webhookPath, webhookVerifyToken, subscriptionFields }
  ) =>
    new WhatsAppAssetsManager(stateController, bot, {
      appId,
      webhookVerifyToken,
      subscriptionFields,
      webhookUrl: connector.getServerUrl(webhookPath),
    }),
})(WhatsAppAssetsManager);

type AssetsManagerP = WhatsAppAssetsManager;

export default AssetsManagerP;
