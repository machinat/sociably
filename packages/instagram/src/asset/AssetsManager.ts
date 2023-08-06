import Http from '@sociably/http';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import {
  SetMetaAppSubscriptionOptions,
  DeleteMetaAppSubscriptionOptions,
} from '@sociably/meta-api';
import {
  MessengerAssetsManager,
  SetPageMessengerProfileOptions,
} from '@sociably/messenger';
import BotP from '../Bot.js';
import InstagramPage from '../Page.js';
import { IG } from '../constant.js';
import { ConfigsI } from '../interface.js';

const DEFAULT_SUBSCRIPTION_FIELDS = [
  'messages',
  'messaging_postbacks',
  'messaging_handovers',
  'messaging_policy_enforcement',
  'messaging_referrals',
];

export type DefaultSettings = {
  appId?: string;
  verifyToken?: string;
  subscriptionFields?: string[];
  webhookUrl?: string;
};

/**
 * InstagramAssetsManager stores name-to-id mapping for assets created on
 * Meta platform.
 * @category Provider
 */
export class InstagramAssetsManager extends MessengerAssetsManager<InstagramPage> {
  defaultSettings: DefaultSettings;

  constructor(
    stateManager: StateControllerI,
    bot: BotP,
    defaultSettings: DefaultSettings = {}
  ) {
    super(stateManager, bot, IG);
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
    objectType = 'instagram',
    appId = this.defaultSettings.appId,
    webhookUrl = this.defaultSettings.webhookUrl,
    fields = this.defaultSettings.subscriptionFields,
    verifyToken = this.defaultSettings.verifyToken,
  }: Partial<SetMetaAppSubscriptionOptions> = {}): Promise<void> {
    if (!appId || !verifyToken || !webhookUrl || !fields?.length) {
      throw new Error('appId, webhookUrl, verifyToken or fields is empty');
    }
    const options = { appId, objectType, webhookUrl, verifyToken, fields };
    return super.setAppSubscription(options);
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
   * Set app subscription of a page. Check https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async setPageSubscribedApp(
    page: string | InstagramPage,
    {
      fields: fieldInput,
      accessToken,
    }: { fields?: string[]; accessToken?: string } = {}
  ): Promise<void> {
    const fields = fieldInput || this.defaultSettings.subscriptionFields;
    if (!fields?.length) {
      throw new Error('subscription fields is empty');
    }
    return super.setPageSubscribedApp(page, { fields, accessToken });
  }

  /**
   * Set Messenger profile of an Instagram account. Check https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/
   * for references.
   */
  async setPageMessengerProfile(
    page: string | InstagramPage,
    { platform = 'instagram', ...profileData }: SetPageMessengerProfileOptions
  ): Promise<void> {
    return super.setPageMessengerProfile(page, { platform, ...profileData });
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP, Http.Configs, ConfigsI],
  factory: (
    stateController,
    bot,
    { entryUrl },
    { appId, verifyToken, webhookPath, subscriptionFields }
  ) =>
    new InstagramAssetsManager(stateController, bot, {
      appId,
      verifyToken,
      subscriptionFields,
      webhookUrl: new URL(webhookPath ?? '', entryUrl).href,
    }),
})(InstagramAssetsManager);

type AssetsManagerP = InstagramAssetsManager;

export default AssetsManagerP;
