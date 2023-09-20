import Http from '@sociably/http';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import {
  SetMetaAppSubscriptionOptions,
  DeleteMetaAppSubscriptionOptions,
} from '@sociably/meta-api';
import {
  MessengerAssetsManager,
  SetSubscribedAppOptions,
  SetMessengerProfileOptions,
} from '@sociably/messenger';
import BotP from '../Bot.js';
import InstagramAgent from '../Agent.js';
import { IG } from '../constant.js';
import { ConfigsI, AgentSettingsAccessorI } from '../interface.js';

// NOTE: instagram subscription fields are not aligned between app and page API
const DEFAULT_APP_SUBSCRIPTION_FIELDS = [
  'messages',
  'messaging_postbacks',
  'messaging_handover',
  'messaging_referral',
];

export type DefaultSettings = {
  appId?: string;
  webhookVerifyToken?: string;
  subscriptionFields?: string[];
  webhookUrl?: string;
};

/**
 * InstagramAssetsManager stores name-to-id mapping for assets created on Meta
 * platform.
 *
 * @category Provider
 */
export class InstagramAssetsManager extends MessengerAssetsManager<InstagramAgent> {
  defaultSettings: DefaultSettings;
  private agentSettingsAccessor: AgentSettingsAccessorI;

  constructor(
    stateManager: StateControllerI,
    bot: BotP,
    agentSettingsAccessor: AgentSettingsAccessorI,
    defaultSettings: DefaultSettings = {},
  ) {
    super(stateManager, bot, IG);
    this.defaultSettings = defaultSettings;
    this.agentSettingsAccessor = agentSettingsAccessor;
  }

  private async getBoundPageIdOfAgent(agentInput: string | InstagramAgent) {
    const agent =
      typeof agentInput === 'string'
        ? new InstagramAgent(agentInput)
        : agentInput;
    const settings = await this.agentSettingsAccessor.getAgentSettings(agent);
    if (!settings) {
      throw new Error(`Instagram agent ${agent.id} not found`);
    }
    return settings.pageId;
  }

  async getAssetId(
    agent: string | InstagramAgent,
    resource: string,
    assetTag: string,
  ): Promise<string | undefined> {
    const pageId = await this.getBoundPageIdOfAgent(agent);
    return super.getAssetId(pageId, resource, assetTag);
  }

  async saveAssetId(
    agent: string | InstagramAgent,
    resource: string,
    assetTag: string,
    assetId: string,
  ) {
    const pageId = await this.getBoundPageIdOfAgent(agent);
    return super.saveAssetId(pageId, resource, assetTag, assetId);
  }

  async unsaveAssetId(
    agent: string | InstagramAgent,
    resource: string,
    assetTag: string,
  ) {
    const pageId = await this.getBoundPageIdOfAgent(agent);
    return super.unsaveAssetId(pageId, resource, assetTag);
  }

  async getAllAssets(agent: string | InstagramAgent, resource: string) {
    const pageId = await this.getBoundPageIdOfAgent(agent);
    return super.getAllAssets(pageId, resource);
  }

  /**
   * Set webhook subscription of an app. Check
   * https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge/
   * for references
   */
  async setAppSubscription({
    objectType = 'instagram',
    appId = this.defaultSettings.appId,
    webhookUrl = this.defaultSettings.webhookUrl,
    fields = this.defaultSettings.subscriptionFields ??
      DEFAULT_APP_SUBSCRIPTION_FIELDS,
    webhookVerifyToken = this.defaultSettings.webhookVerifyToken,
  }: Partial<SetMetaAppSubscriptionOptions> = {}): Promise<void> {
    if (!appId || !webhookVerifyToken || !webhookUrl || !fields?.length) {
      throw new Error(
        'appId, webhookUrl, webhookVerifyToken or fields is empty',
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

  /**
   * Set app subscription of a instagram account. Check
   * https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async setSubscribedApp(
    agent: string | InstagramAgent,
    {
      fields = this.defaultSettings.subscriptionFields,
      accessToken,
    }: SetSubscribedAppOptions = {},
  ): Promise<void> {
    return super.setSubscribedApp(agent, { fields, accessToken });
  }

  /**
   * Set Messenger profile of an Instagram account. Check
   * https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/
   * for references.
   */
  async setMessengerProfile(
    agent: string | InstagramAgent,
    { platform = 'instagram', ...profileData }: SetMessengerProfileOptions,
  ): Promise<void> {
    return super.setMessengerProfile(agent, { platform, ...profileData });
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [
    StateControllerI,
    BotP,
    Http.Connector,
    AgentSettingsAccessorI,
    ConfigsI,
  ],
  factory: (
    stateController,
    bot,
    connector,
    agentSettingsAccessor,
    { appId, webhookVerifyToken, webhookPath, subscriptionFields },
  ) =>
    new InstagramAssetsManager(stateController, bot, agentSettingsAccessor, {
      appId,
      webhookVerifyToken,
      subscriptionFields,
      webhookUrl: connector.getServerUrl(webhookPath),
    }),
})(InstagramAssetsManager);

type AssetsManagerP = InstagramAssetsManager;

export default AssetsManagerP;
