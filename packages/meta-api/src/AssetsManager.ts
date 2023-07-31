import StateControllerI from '@sociably/core/base/StateController';
import {
  MetaApiBot,
  SetMetaAppSubscriptionOptions,
  DeleteMetaAppSubscriptionOptions,
} from './types.js';

export class MetaAssetsManager {
  protected bot: MetaApiBot;
  private stateController: StateControllerI;
  private platformShortId: string;

  constructor(
    stateManager: StateControllerI,
    bot: MetaApiBot,
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
    verifyToken,
  }: SetMetaAppSubscriptionOptions): Promise<void> {
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
    appId,
    objectType,
    fields,
  }: DeleteMetaAppSubscriptionOptions): Promise<void> {
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

  async getAssetId(
    agentId: string,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const existed = await this.stateController
      .globalState(this.makeResourceKey(agentId, resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    agentId: string,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this.stateController
      .globalState(this.makeResourceKey(agentId, resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    agentId: string,
    resource: string
  ): Promise<null | Map<string, string>> {
    return this.stateController
      .globalState(this.makeResourceKey(agentId, resource))
      .getAll();
  }

  async unsaveAssetId(
    agentId: string,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const isDeleted = await this.stateController
      .globalState(this.makeResourceKey(agentId, resource))
      .delete(assetTag);
    return isDeleted;
  }

  private makeResourceKey(agentId: string, resource: string): string {
    return `$${this.platformShortId}.${resource}.${agentId}`;
  }
}

export default MetaAssetsManager;
