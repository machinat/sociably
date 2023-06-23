import deepEqual from 'fast-deep-equal';
import type { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import snakecaseKeys from 'snakecase-keys';
import BotP from '../Bot.js';
import FacebookPage from '../Page.js';
import { PATH_PERSONAS, FB } from '../constant.js';
import { ConfigsI } from '../interface.js';

const ATTACHMENT = 'attachment';
const PERSONA = 'persona';

const makeResourceKey = (pageId: string, resource: string): string =>
  `$${FB}.${resource}.${pageId}`;

const mapLocaleInstancesToRecord = (values) =>
  Object.fromEntries(values.map((value) => [value.locale, value]));
const deepCompareLocaleInstances = (a, b) =>
  deepEqual(mapLocaleInstancesToRecord(a), mapLocaleInstancesToRecord(b));
const MESSENGER_PROFILE_FIELDS_COMPARATERS: Record<string, (a, b) => boolean> =
  {
    get_started: deepEqual,
    greeting: deepCompareLocaleInstances,
    ice_breakers: deepCompareLocaleInstances,
    persistent_menu: deepCompareLocaleInstances,
    whitelisted_domains: (a, b) => deepEqual(a.sort(), b.sort()),
    account_linking_url: (a, b) => a === b,
  };

const DEFAULT_PAGE_SUBSCRIPTION_FIELDS = [
  'messages',
  'messaging_postbacks',
  'messaging_optins',
  'messaging_handovers',
  'messaging_policy_enforcement',
  'messaging_account_linking',
  'messaging_game_plays',
  'messaging_referrals',
];

export type DefaultAppSettings = {
  appId?: string;
  verifyToken?: string;
  pageSubscriptionFields?: string[];
};

/**
 * FacebookAssetsManager stores name-to-id mapping for assets created in
 * Facebook platform.
 * @category Provider
 */
export class FacebookAssetsManager {
  private _bot: BotP;
  private _stateController: StateControllerI;
  defaultAppSettings?: DefaultAppSettings;

  constructor(
    stateManager: StateControllerI,
    bot: BotP,
    defaultAppSettings?: DefaultAppSettings
  ) {
    this._stateController = stateManager;
    this._bot = bot;
    this.defaultAppSettings = defaultAppSettings;
  }

  /**
   * Set webhook subscription of an app. Check https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge/
   * for references
   */
  async setAppSubscription({
    webhookUrl,
    objectType = 'page',
    fields: fieldsInput,
    appId: appIdInput,
    verifyToken: verifyTokenInput,
  }: {
    /** The URL to receive the webhook */
    webhookUrl: string;
    /** Indicates the object type that this subscription applies to. Default to `page` */
    objectType?: 'user' | 'page' | 'permissions' | 'payments';
    /** One or more of the set of valid fields in this object to subscribe to */
    fields?: string[];
    /** Specify the verify token to confirm the webhook with */
    verifyToken?: string;
    /** Specify the app to remove subscriptions for */
    appId?: string;
  }): Promise<void> {
    const appId = appIdInput || this.defaultAppSettings?.appId;
    const verifyToken =
      verifyTokenInput || this.defaultAppSettings?.verifyToken;
    const fields =
      fieldsInput ||
      this.defaultAppSettings?.pageSubscriptionFields ||
      DEFAULT_PAGE_SUBSCRIPTION_FIELDS;

    if (!appId || !verifyToken || !webhookUrl || !fields?.length) {
      throw new Error('appId, url, verifyToken or fields is empty');
    }

    await this._bot.requestApi({
      asApplication: true,
      method: 'POST',
      url: `${appId}/subscriptions`,
      params: {
        object: objectType,
        callback_url: webhookUrl,
        fields,
        include_values: true,
        verify_token: verifyToken,
      },
    });
  }

  async deleteAppSubscription({
    appId: appIdInput,
    objectType,
    fields,
  }: {
    /**
     * One or more of the set of valid fields in this object to subscribe to.
     * If not specified, subscriptios of all the fields is removed.
     */
    fields?: string[];
    /**
     * A specific object type to remove subscriptions for. If this optional
     * field is not included, all subscriptions for this app will be removed.
     */
    objectType?: 'user' | 'page' | 'permissions' | 'payments';
    /** Specify the app to remove subscriptions for */
    appId?: string;
  } = {}): Promise<void> {
    const appId = appIdInput || this.defaultAppSettings?.appId;
    if (!appId) {
      throw new Error('appId is empty');
    }

    await this._bot.requestApi({
      asApplication: true,
      method: 'DELETE',
      url: `${appId}/subscriptions`,
      params: {
        object: objectType,
        fields,
      },
    });
  }

  /**
   * Set app subscription of a page. Check https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async setPageSubscribedApp(
    page: string | FacebookPage,
    options?: { fields?: string[]; accessToken?: string }
  ): Promise<void> {
    const fields =
      options?.fields ||
      this.defaultAppSettings?.pageSubscriptionFields ||
      DEFAULT_PAGE_SUBSCRIPTION_FIELDS;

    await this._bot.requestApi({
      page,
      accessToken: options?.accessToken,
      method: 'POST',
      url: 'me/subscribed_apps',
      params: {
        subscribed_fields: fields,
      },
    });
  }

  /**
   * Delete app subscription of a page. Check https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async deletePageSubscribedApp(
    page: string | FacebookPage,
    options?: { accessToken?: string }
  ): Promise<void> {
    await this._bot.requestApi({
      page,
      accessToken: options?.accessToken,
      method: 'DELETE',
      url: 'me/subscribed_apps',
    });
  }

  /**
   * Set Messenger profile of a page. Check https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/
   * for references.
   */
  async setPageMessengerProfile(
    page: string | FacebookPage,
    settingsInput: Record<string, unknown>,
    { accessToken }: { accessToken?: string } = {}
  ): Promise<void> {
    const newSettings = snakecaseKeys(settingsInput);

    const {
      data: [currentSettings = {}],
    } = await this._bot.requestApi({
      page,
      accessToken,
      method: 'GET',
      url: 'me/messenger_profile',
      params: {
        fields: Object.keys(MESSENGER_PROFILE_FIELDS_COMPARATERS),
      },
    });

    const deletedKeys: string[] = [];
    const changedSettings: Record<string, unknown> = {};

    for (const key of Object.keys(currentSettings)) {
      if (newSettings[key] === undefined) {
        deletedKeys.push(key);
      }
    }
    for (const [key, value] of Object.entries(newSettings)) {
      const comparator = MESSENGER_PROFILE_FIELDS_COMPARATERS[key] || deepEqual;
      const currentValue = currentSettings[key];
      if (currentValue === undefined || !comparator(currentValue, value)) {
        changedSettings[key] = value;
      }
    }

    if (deletedKeys.length > 0) {
      await this._bot.requestApi({
        page,
        accessToken,
        method: 'DELETE',
        url: 'me/messenger_profile',
        params: { fields: deletedKeys },
      });
    }

    if (Object.keys(changedSettings).length > 0) {
      await this._bot.requestApi({
        page,
        accessToken,
        method: 'POST',
        url: 'me/messenger_profile',
        params: changedSettings,
      });
    }
  }

  async getAssetId(
    page: string | FacebookPage,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const pageId = typeof page === 'string' ? page : page.id;
    const existed = await this._stateController
      .globalState(makeResourceKey(pageId, resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    page: string | FacebookPage,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;
    const isUpdated = await this._stateController
      .globalState(makeResourceKey(pageId, resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    page: string | FacebookPage,
    resource: string
  ): Promise<null | Map<string, string>> {
    const pageId = typeof page === 'string' ? page : page.id;
    return this._stateController
      .globalState(makeResourceKey(pageId, resource))
      .getAll();
  }

  async unsaveAssetId(
    page: string | FacebookPage,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;

    const isDeleted = await this._stateController
      .globalState(makeResourceKey(pageId, resource))
      .delete(assetTag);
    return isDeleted;
  }

  getAttachment(
    page: string | FacebookPage,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(page, ATTACHMENT, assetTag);
  }

  saveAttachment(
    page: string | FacebookPage,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(page, ATTACHMENT, assetTag, id);
  }

  getAllAttachments(
    page: string | FacebookPage
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(page, ATTACHMENT);
  }

  unsaveAttachment(
    page: string | FacebookPage,
    assetTag: string
  ): Promise<boolean> {
    return this.unsaveAssetId(page, ATTACHMENT, assetTag);
  }

  /** Upload and save a Messenger chat attachment */
  async uploadChatAttachment(
    page: string | FacebookPage,
    assetTag: string,
    node: SociablyNode
  ): Promise<string> {
    const result = await this._bot.uploadChatAttachment(page, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachmentId } = result;
    await this.saveAssetId(page, ATTACHMENT, assetTag, attachmentId);
    return attachmentId;
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
    const { id: personaId } = await this._bot.requestApi<{ id: string }>({
      page,
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

    await this._bot.requestApi({
      page,
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
  deps: [StateControllerI, BotP, ConfigsI],
  factory: (stateController, bot, fbConfigs) =>
    new FacebookAssetsManager(stateController, bot, {
      appId: fbConfigs.appId,
      verifyToken: fbConfigs.verifyToken,
    }),
})(FacebookAssetsManager);

type AssetsManagerP = FacebookAssetsManager;

export default AssetsManagerP;
