import deepEqual from 'fast-deep-equal';
import { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { MetaAssetsManager, MetaApiChannel } from '@sociably/meta-api';
import snakecaseKeys from 'snakecase-keys';
import { MESSENGER_PAGE_SUBSCRIPTION_FIELDS } from '../constant.js';
import {
  MessengerBot,
  SetSubscribedAppOptions,
  SetMessengerProfileOptions,
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
  Channel extends MetaApiChannel,
> extends MetaAssetsManager<Channel, MessengerBot<Channel>> {
  /**
   * Set app subscription of a page. Check https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async setSubscribedApp(
    channel: string | Channel,
    {
      fields = MESSENGER_PAGE_SUBSCRIPTION_FIELDS,
      accessToken,
    }: SetSubscribedAppOptions
  ): Promise<void> {
    await this.bot.requestApi({
      channel,
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
  async deleteSubscribedApp(channel: string | Channel): Promise<void> {
    await this.bot.requestApi({
      channel,
      asApp: true,
      method: 'DELETE',
      url: 'me/subscribed_apps',
    });
  }

  /**
   * Set Messenger profile of a page. Check https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/
   * for references.
   */
  async setMessengerProfile(
    channel: string | Channel,
    { platform, accessToken, ...profileData }: SetMessengerProfileOptions
  ): Promise<void> {
    const newSettings = snakecaseKeys(profileData);

    const {
      data: [currentSettings = {}],
    } = await this.bot.requestApi({
      channel,
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
        channel,
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
        channel,
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

  getAttachment(
    channel: string | Channel,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(channel, ATTACHMENT, assetTag);
  }

  saveAttachment(
    channel: string | Channel,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(channel, ATTACHMENT, assetTag, id);
  }

  getAllAttachments(
    channel: string | Channel
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(channel, ATTACHMENT);
  }

  unsaveAttachment(
    channel: string | Channel,
    assetTag: string
  ): Promise<boolean> {
    return this.unsaveAssetId(channel, ATTACHMENT, assetTag);
  }

  /** Upload and save a Messenger chat attachment */
  async uploadChatAttachment(
    channel: string | Channel,
    assetTag: string,
    node: SociablyNode
  ): Promise<string> {
    const result = await this.bot.uploadChatAttachment(channel, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachmentId } = result;
    await this.saveAssetId(channel, ATTACHMENT, assetTag, attachmentId);
    return attachmentId;
  }
}

export default MessengerAssetsManager;
