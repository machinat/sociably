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
  MESSENGER_PAGE_SUBSCRIPTION_FIELDS,
} from '@sociably/messenger';
import snakecaseKeys from 'snakecase-keys';
import BotP, { FacebookBot } from '../Bot.js';
import FacebookPage from '../Page.js';
import { PATH_PERSONAS, FB } from '../constant.js';
import { ConfigsI } from '../interface.js';

const PERSONA = 'persona';

export type DefaultSettings = {
  appId?: string;
  webhookVerifyToken?: string;
  subscriptionFields?: string[];
  webhookUrl?: string;
};

/**
 * FacebookAssetsManager stores name-to-id mapping for assets created in
 * Facebook platform.
 * @category Provider
 */
export class FacebookAssetsManager extends MessengerAssetsManager<FacebookPage> {
  defaultSettings: DefaultSettings;
  bot: FacebookBot;

  constructor(
    stateManager: StateControllerI,
    bot: BotP,
    defaultSettings: DefaultSettings = {}
  ) {
    super(stateManager, bot, FB);
    this.defaultSettings = defaultSettings;
  }

  /**
   * Set webhook subscription of an app. Check https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge/
   * for references
   */
  async setAppSubscription({
    objectType = 'page',
    appId = this.defaultSettings.appId,
    fields = this.defaultSettings.subscriptionFields ??
      MESSENGER_PAGE_SUBSCRIPTION_FIELDS,
    webhookUrl = this.defaultSettings.webhookUrl,
    webhookVerifyToken = this.defaultSettings.webhookVerifyToken,
  }: Partial<SetMetaAppSubscriptionOptions> = {}) {
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
  }: Partial<DeleteMetaAppSubscriptionOptions> = {}) {
    if (!appId) {
      throw new Error('appId is empty');
    }
    return super.deleteAppSubscription({ appId, objectType, fields });
  }

  /**
   * Set app subscription of a page. Check https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async setSubscribedApp(
    page: string | FacebookPage,
    {
      fields = this.defaultSettings.subscriptionFields,
      accessToken,
    }: SetSubscribedAppOptions = {}
  ) {
    return super.setSubscribedApp(page, {
      fields,
      accessToken,
    });
  }

  getPersona(
    page: string | FacebookPage,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(page, PERSONA, assetTag);
  }

  getAllPersonas(
    page: string | FacebookPage
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(page, PERSONA);
  }

  savePersona(
    page: string | FacebookPage,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(page, PERSONA, assetTag, id);
  }

  unsavePersona(
    page: string | FacebookPage,
    assetTag: string
  ): Promise<boolean> {
    return this.unsaveAssetId(page, PERSONA, assetTag);
  }

  /**
   * Create and save a Messenger persona. Check https://developers.facebook.com/docs/messenger-platform/reference/personas-api
   * for details
   */
  async createPersona(
    page: string | FacebookPage,
    assetTag: string,
    {
      name,
      profilePictureUrl,
      accessToken,
    }: {
      /** The display name of the persona */
      name: string;
      /** The URL of the user icon associated with the persona */
      profilePictureUrl?: string;
      /** Specify the access token to be used on the API call */
      accessToken?: string;
    }
  ): Promise<string> {
    const { id: personaId } = await this.bot.requestApi<{ id: string }>({
      channel: page,
      accessToken,
      method: 'POST',
      url: PATH_PERSONAS,
      params: snakecaseKeys({ name, profilePictureUrl }),
    });

    await this.saveAssetId(page, PERSONA, assetTag, personaId);
    return personaId;
  }

  /** Delete and unsave a Messenger persona */
  async deletePersona(
    page: string | FacebookPage,
    assetTag: string,
    options?: { accessToken?: string }
  ): Promise<boolean> {
    const personaId = await this.getPersona(page, assetTag);
    if (!personaId) {
      return false;
    }

    await this.bot.requestApi({
      channel: page,
      accessToken: options?.accessToken,
      method: 'DELETE',
      url: personaId,
    });
    await this.unsavePersona(page, assetTag);
    return true;
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP, Http.Connector, ConfigsI],
  factory: (
    stateController,
    bot,
    connector,
    { appId, webhookVerifyToken, webhookPath, subscriptionFields }
  ) =>
    new FacebookAssetsManager(stateController, bot, {
      appId,
      webhookVerifyToken,
      subscriptionFields,
      webhookUrl: connector.getServerUrl(webhookPath),
    }),
})(FacebookAssetsManager);

type AssetsManagerP = FacebookAssetsManager;

export default AssetsManagerP;
