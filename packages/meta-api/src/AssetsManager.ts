import StateControllerI from '@sociably/core/base/StateController';
import {
  MetaApiBot,
  MetaApiChannel,
  SetMetaAppSubscriptionOptions,
  DeleteMetaAppSubscriptionOptions,
} from './types.js';

const channelInputId = (channel: string | MetaApiChannel): string =>
  typeof channel === 'string' ? channel : channel.id;

export class MetaAssetsManager<
  Channel extends MetaApiChannel,
  Bot extends MetaApiBot<Channel>,
> {
  protected bot: Bot;
  private stateController: StateControllerI;
  private platformShortId: string;

  constructor(
    stateManager: StateControllerI,
    bot: Bot,
    platformShortId: string
  ) {
    this.stateController = stateManager;
    this.bot = bot;
    this.platformShortId = platformShortId;
  }

  async setAppSubscription({
    objectType,
    webhookUrl,
    fields,
    appId,
    webhookVerifyToken,
  }: SetMetaAppSubscriptionOptions): Promise<void> {
    await this.bot.requestApi({
      asApp: true,
      method: 'POST',
      url: `${appId}/subscriptions`,
      params: {
        object: objectType,
        callback_url: webhookUrl,
        fields,
        include_values: true,
        verify_token: webhookVerifyToken,
      },
    });
  }

  async deleteAppSubscription({
    appId,
    objectType,
    fields,
  }: DeleteMetaAppSubscriptionOptions): Promise<void> {
    await this.bot.requestApi({
      asApp: true,
      method: 'DELETE',
      url: `${appId}/subscriptions`,
      params: {
        object: objectType,
        fields,
      },
    });
  }

  async getAssetId(
    channel: string | Channel,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const existed = await this.stateController
      .globalState(this.makeResourceKey(channelInputId(channel), resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    channel: string | Channel,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this.stateController
      .globalState(this.makeResourceKey(channelInputId(channel), resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    channel: string | Channel,
    resource: string
  ): Promise<null | Map<string, string>> {
    return this.stateController
      .globalState(this.makeResourceKey(channelInputId(channel), resource))
      .getAll();
  }

  async unsaveAssetId(
    channel: string | Channel,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const isDeleted = await this.stateController
      .globalState(this.makeResourceKey(channelInputId(channel), resource))
      .delete(assetTag);
    return isDeleted;
  }

  private makeResourceKey(channel: string | Channel, resource: string): string {
    return `$${this.platformShortId}.${resource}.${channelInputId(channel)}`;
  }
}

export default MetaAssetsManager;
