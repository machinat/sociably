import deepEqual from 'fast-deep-equal';
import { SociablyNode } from '@sociably/core';
import StateControllerI from '@sociably/core/base/StateController';
import { formatNode } from '@sociably/core/utils';
import snakecaseKeys from 'snakecase-keys';
import { MessengerBot, MessengerPage } from '../types.js';

const ATTACHMENT = 'attachment';

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

export type DefaultSettings = {
  messengerPlatform?: string;
  pageSubscriptionFields?: string[];
  appId?: string;
  verifyToken?: string;
  webhookUrl?: string;
};

export type SetPageMessengerProfileOptions = {
  /** Specify the access token to be used on the API call */
  accessToken?: string;
  /** Specify the platform option */
  platform?: string;
  /**
   * The payload that will be sent as a `messaging_postbacks` event when someone
   * taps the 'get started' button on your Page Messenger welcome screen.
   */
  getStarted?: { payload: string };
  /**
   * An array of locale-specific greeting messages to display on your Page
   * Messenger welcome screen.
   */
  greeting?: { locale: string; text: string }[];
  /** An array with an ice breaker object. */
  iceBreakers?: {
    locale: string;
    callToActions: { question: string; payload: string }[];
  }[];
  /**
   * An array of call-to-action buttons to include in the persistent menu.
   */
  persistentMenu?: {
    locale: string;
    composerInputDisabled?: boolean;
    callToActions: {
      type: 'postback' | 'web_url';
      title: string;
      payload?: string;
      url?: string;
      webviewHeightRatio?: 'compact' | 'tall' | 'full';
      messengerExtensions?: boolean;
      fallbackUrl?: string;
      webviewShareButton?: 'hide';
    }[];
    disabledSurfaces?: 'customer_chat_plugin'[];
  }[];
  /**
   * A list of whitelisted domains. Required for Pages that use the Messenger
   * Extensions SDK and the checkbox plugin.
   */
  whitelistedDomains?: string[];
  /**
   * Authentication callback URL. Must use https protocol.
   */
  accountLinkingUrl?: string;
};

/**
 * MessengerAssetsManager manage assets of Messenger platform.
 * @category Provider
 */
export class MessengerAssetsManager<Page extends MessengerPage> {
  protected bot: MessengerBot<Page>;
  private stateController: StateControllerI;
  private platformShortId: string;
  defaultAppSettings: DefaultSettings;

  constructor(
    stateManager: StateControllerI,
    bot: MessengerBot<Page>,
    platformShortId: string,
    defaultAppSettings: DefaultSettings = {}
  ) {
    this.stateController = stateManager;
    this.bot = bot;
    this.defaultAppSettings = defaultAppSettings;
    this.platformShortId = platformShortId;
  }

  /**
   * Set webhook subscription of an app. Check https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge/
   * for references
   */
  async setAppSubscription({
    objectType = 'page',
    webhookUrl: webhookUrlInput,
    fields: fieldsInput,
    appId: appIdInput,
    verifyToken: verifyTokenInput,
  }: {
    /** The URL to receive the webhook */
    webhookUrl?: string;
    /** Indicates the object type that this subscription applies to. Default to `page` */
    objectType?: 'user' | 'page' | 'permissions' | 'payments';
    /** One or more of the set of valid fields in this object to subscribe to */
    fields?: string[];
    /** Specify the verify token to confirm the webhook with */
    verifyToken?: string;
    /** Specify the app to remove subscriptions for */
    appId?: string;
  }): Promise<void> {
    const appId = appIdInput || this.defaultAppSettings.appId;
    const webhookUrl = webhookUrlInput || this.defaultAppSettings.webhookUrl;
    const verifyToken = verifyTokenInput || this.defaultAppSettings.verifyToken;
    const fields =
      fieldsInput || this.defaultAppSettings.pageSubscriptionFields;

    if (!appId || !verifyToken || !webhookUrl || !fields?.length) {
      throw new Error('appId, webhookUrl, verifyToken or fields is empty');
    }

    await this.bot.requestApi({
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

    await this.bot.requestApi({
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
    page: string | Page,
    options?: { fields?: string[]; accessToken?: string }
  ): Promise<void> {
    const fields =
      options?.fields || this.defaultAppSettings.pageSubscriptionFields;
    if (!fields) {
      throw new Error('subscription fields is empty');
    }

    await this.bot.requestApi({
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
    page: string | Page,
    options?: { accessToken?: string }
  ): Promise<void> {
    await this.bot.requestApi({
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
    page: string | Page,
    {
      platform: platformInput,
      accessToken,
      ...profileData
    }: SetPageMessengerProfileOptions
  ): Promise<void> {
    const newSettings = snakecaseKeys(profileData);
    const platform = platformInput ?? this.defaultAppSettings.messengerPlatform;

    const {
      data: [currentSettings = {}],
    } = await this.bot.requestApi({
      page,
      accessToken,
      method: 'GET',
      url: 'me/messenger_profile',
      params: {
        platform,
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
      await this.bot.requestApi({
        page,
        accessToken,
        method: 'DELETE',
        url: 'me/messenger_profile',
        params: {
          platform,
          fields: deletedKeys,
        },
      });
    }

    if (Object.keys(changedSettings).length > 0) {
      await this.bot.requestApi({
        page,
        accessToken,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          platform,
          ...changedSettings,
        },
      });
    }
  }

  async getAssetId(
    page: string | Page,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const pageId = typeof page === 'string' ? page : page.id;
    const existed = await this.stateController
      .globalState(this.makeResourceKey(pageId, resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    page: string | Page,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;
    const isUpdated = await this.stateController
      .globalState(this.makeResourceKey(pageId, resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    page: string | Page,
    resource: string
  ): Promise<null | Map<string, string>> {
    const pageId = typeof page === 'string' ? page : page.id;
    return this.stateController
      .globalState(this.makeResourceKey(pageId, resource))
      .getAll();
  }

  async unsaveAssetId(
    page: string | Page,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;
    const isDeleted = await this.stateController
      .globalState(this.makeResourceKey(pageId, resource))
      .delete(assetTag);
    return isDeleted;
  }

  getAttachment(
    page: string | Page,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(page, ATTACHMENT, assetTag);
  }

  saveAttachment(
    page: string | Page,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(page, ATTACHMENT, assetTag, id);
  }

  getAllAttachments(page: string | Page): Promise<null | Map<string, string>> {
    return this.getAllAssets(page, ATTACHMENT);
  }

  unsaveAttachment(page: string | Page, assetTag: string): Promise<boolean> {
    return this.unsaveAssetId(page, ATTACHMENT, assetTag);
  }

  /** Upload and save a Messenger chat attachment */
  async uploadChatAttachment(
    page: string | Page,
    assetTag: string,
    node: SociablyNode
  ): Promise<string> {
    const result = await this.bot.uploadChatAttachment(page, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachmentId } = result;
    await this.saveAssetId(page, ATTACHMENT, assetTag, attachmentId);
    return attachmentId;
  }

  private makeResourceKey(pageId: string, resource: string): string {
    return `$${this.platformShortId}.${resource}.${pageId}`;
  }
}

export default MessengerAssetsManager;
