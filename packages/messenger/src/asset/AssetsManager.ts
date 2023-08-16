import deepEqual from 'fast-deep-equal';
import { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { MetaAssetsManager } from '@sociably/meta-api';
import snakecaseKeys from 'snakecase-keys';
import {
  MessengerBot,
  MessengerPage,
  SetPageSubscribedAppOptions,
  SetPageMessengerProfileOptions,
} from '../types.js';

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

/**
 * MessengerAssetsManager manage assets of Messenger platform.
 * @category Provider
 */
export class MessengerAssetsManager<
  Page extends MessengerPage,
> extends MetaAssetsManager {
  protected bot: MessengerBot<Page>;

  /**
   * Set app subscription of a page. Check https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async setPageSubscribedApp(
    page: string | Page,
    { fields, accessToken }: SetPageSubscribedAppOptions
  ): Promise<void> {
    await this.bot.requestApi({
      page,
      accessToken,
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
  async deletePageSubscribedApp(page: string | Page): Promise<void> {
    await this.bot.requestApi({
      page,
      asApp: true,
      method: 'DELETE',
      url: `${typeof page === 'string' ? page : page.id}/subscribed_apps`,
    });
  }

  /**
   * Set Messenger profile of a page. Check https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/
   * for references.
   */
  async setPageMessengerProfile(
    page: string | Page,
    { platform, accessToken, ...profileData }: SetPageMessengerProfileOptions
  ): Promise<void> {
    const newSettings = snakecaseKeys(profileData);

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
    return super.getAssetId(pageId, resource, assetTag);
  }

  async saveAssetId(
    page: string | Page,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;
    return super.saveAssetId(pageId, resource, assetTag, id);
  }

  getAllAssets(
    page: string | Page,
    resource: string
  ): Promise<null | Map<string, string>> {
    const pageId = typeof page === 'string' ? page : page.id;
    return super.getAllAssets(pageId, resource);
  }

  async unsaveAssetId(
    page: string | Page,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const pageId = typeof page === 'string' ? page : page.id;
    return super.unsaveAssetId(pageId, resource, assetTag);
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
}

export default MessengerAssetsManager;
