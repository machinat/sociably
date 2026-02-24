import deepEqual from 'fast-deep-equal';
import { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { MetaAssetsManager, MetaApiAgent } from '@sociably/meta-api';
import snakecaseKeys from 'snakecase-keys';
import { MESSENGER_PAGE_SUBSCRIPTION_FIELDS } from '../constant.js';
import {
  MessengerSender,
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
 *
 * @category Provider
 */
export class MessengerAssetsManager<
  Agent extends MetaApiAgent,
> extends MetaAssetsManager<Agent, MessengerSender<Agent>> {
  /**
   * Set app subscription of a page. Check
   * https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async setSubscribedApp(
    agent: string | Agent,
    {
      fields = MESSENGER_PAGE_SUBSCRIPTION_FIELDS,
      accessToken,
    }: SetSubscribedAppOptions,
  ): Promise<void> {
    await this.sender.requestApi({
      agent,
      accessToken,
      method: 'POST',
      url: 'me/subscribed_apps',
      params: {
        subscribed_fields: fields,
      },
    });
  }

  /**
   * Delete app subscription of a page. Check
   * https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
   * for references.
   */
  async deleteSubscribedApp(
    agent: string | Agent,
    { accessToken }: { accessToken?: string } = {},
  ): Promise<void> {
    await this.sender.requestApi({
      agent,
      accessToken,
      method: 'DELETE',
      url: 'me/subscribed_apps',
    });
  }

  /**
   * Set Messenger profile of a page. Check
   * https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/
   * for references.
   */
  async setMessengerProfile(
    agent: string | Agent,
    { platform, accessToken, ...profileData }: SetMessengerProfileOptions,
  ): Promise<void> {
    const newSettings = snakecaseKeys(profileData);

    const {
      data: [currentSettings = {}],
    } = await this.sender.requestApi({
      agent,
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
      await this.sender.requestApi({
        agent,
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
      await this.sender.requestApi({
        agent,
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
    agent: string | Agent,
    assetTag: string,
  ): Promise<undefined | string> {
    return this.getAssetId(agent, ATTACHMENT, assetTag);
  }

  saveAttachment(
    agent: string | Agent,
    assetTag: string,
    id: string,
  ): Promise<boolean> {
    return this.saveAssetId(agent, ATTACHMENT, assetTag, id);
  }

  getAllAttachments(
    agent: string | Agent,
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, ATTACHMENT);
  }

  unsaveAttachment(agent: string | Agent, assetTag: string): Promise<boolean> {
    return this.unsaveAssetId(agent, ATTACHMENT, assetTag);
  }

  /** Upload and save a Messenger chat attachment */
  async uploadChatAttachment(
    agent: string | Agent,
    assetTag: string,
    node: SociablyNode,
  ): Promise<string> {
    const result = await this.sender.uploadChatAttachment(agent, node);
    if (result === null) {
      throw new Error(`message ${formatNode(node)} render to empty`);
    }

    const { attachmentId } = result;
    await this.saveAssetId(agent, ATTACHMENT, assetTag, attachmentId);
    return attachmentId;
  }
}

export default MessengerAssetsManager;
