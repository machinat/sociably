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

export type AppWebhookSubscriptionOptions = {
  appId?: string;
  verifyToken?: string;
  url: string;
  fields?: string[];
  objectType?: 'user' | 'page' | 'permissions' | 'payments';
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

  async setAppSubscriptionWebhook({
    url: webhookUrl,
    objectType = 'page',
    fields: fieldsInput,
    appId: appIdInput,
    verifyToken: verifyTokenInput,
  }: AppWebhookSubscriptionOptions): Promise<void> {
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

  async setPageSubscribedApp(
    page: string | FacebookPage,
    options?: { fields?: string[] }
  ): Promise<void> {
    const fields =
      options?.fields ||
      this.defaultAppSettings?.pageSubscriptionFields ||
      DEFAULT_PAGE_SUBSCRIPTION_FIELDS;

    await this._bot.requestApi({
      page,
      method: 'POST',
      url: 'me/subscribed_apps',
      params: {
        subscribed_fields: fields,
      },
    });
  }

  async setPageMessengerProfile(
    page: string | FacebookPage,
    settingsInput: Record<string, unknown>
  ): Promise<void> {
    const newSettings = snakecaseKeys(settingsInput);

    const {
      data: [currentSettings],
    } = await this._bot.requestApi({
      page,
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
        method: 'DELETE',
        url: 'me/messenger_profile',
        params: { fields: deletedKeys },
      });
    }

    if (Object.keys(changedSettings).length > 0) {
      await this._bot.requestApi({
        page,
        method: 'POST',
        url: 'me/messenger_profile',
        params: changedSettings,
      });
    }
  }

  async getAssetId(
    page: string | FacebookPage,
    resource: string,
    name: string
  ): Promise<undefined | string> {
    const pageId = typeof page === 'string' ? page : page.id;
    const existed = await this._stateController
      .globalState(makeResourceKey(pageId, resource))
      .get<string>(name);
    return existed || undefined;
  }

  async saveAssetId(
    page: string | FacebookPage,
    resource: string,
    name: string,
    id: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;
    const isUpdated = await this._stateController
      .globalState(makeResourceKey(pageId, resource))
      .set<string>(name, id);
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
    name: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;

    const isDeleted = await this._stateController
      .globalState(makeResourceKey(pageId, resource))
      .delete(name);
    return isDeleted;
  }

  getAttachment(
    page: string | FacebookPage,
    name: string
  ): Promise<undefined | string> {
    return this.getAssetId(page, ATTACHMENT, name);
  }

  saveAttachment(
    page: string | FacebookPage,
    name: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(page, ATTACHMENT, name, id);
  }

  getAllAttachments(
    page: string | FacebookPage
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(page, ATTACHMENT);
  }

  unsaveAttachment(
    page: string | FacebookPage,
    name: string
  ): Promise<boolean> {
    return this.unsaveAssetId(page, ATTACHMENT, name);
  }

  async uploadChatAttachment(
    page: string | FacebookPage,
    name: string,
    node: SociablyNode
  ): Promise<string> {
    const existed = await this.getAttachment(page, name);
    if (existed !== undefined) {
      throw new Error(`attachment [ ${name} ] already exist`);
    }

    const result = await this._bot.uploadChatAttachment(page, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachmentId } = result;
    await this.saveAssetId(page, ATTACHMENT, name, attachmentId);
    return attachmentId;
  }

  getPersona(
    page: string | FacebookPage,
    name: string
  ): Promise<undefined | string> {
    return this.getAssetId(page, PERSONA, name);
  }

  getAllPersonas(
    page: string | FacebookPage
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(page, PERSONA);
  }

  savePersona(
    page: string | FacebookPage,
    name: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(page, PERSONA, name, id);
  }

  unsavePersona(page: string | FacebookPage, name: string): Promise<boolean> {
    return this.unsaveAssetId(page, PERSONA, name);
  }

  async createPersona(
    page: string | FacebookPage,
    assetName: string,
    params: {
      name: string;
      profilePictureUrl?: string;
    }
  ): Promise<string> {
    const existed = await this.getPersona(page, assetName);
    if (existed !== undefined) {
      throw new Error(`persona [ ${assetName} ] already exist`);
    }

    const { id: personaId } = await this._bot.requestApi<{ id: string }>({
      page,
      method: 'POST',
      url: PATH_PERSONAS,
      params: snakecaseKeys(params),
    });

    await this.saveAssetId(page, PERSONA, assetName, personaId);
    return personaId;
  }

  async deletePersona(
    page: string | FacebookPage,
    name: string
  ): Promise<boolean> {
    const personaId = await this.getPersona(page, name);
    if (!personaId) {
      return false;
    }

    await this._bot.requestApi({ page, method: 'DELETE', url: personaId });
    await this.unsavePersona(page, name);
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
