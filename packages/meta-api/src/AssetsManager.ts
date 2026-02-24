import StateRepositoryI from '@sociably/core/base/StateRepository.js';
import {
  MetaApiSender,
  MetaApiAgent,
  SetMetaAppSubscriptionOptions,
  DeleteMetaAppSubscriptionOptions,
} from './types.js';

const agentInputId = (agent: string | MetaApiAgent): string =>
  typeof agent === 'string' ? agent : agent.id;

export class MetaAssetsManager<
  Agent extends MetaApiAgent,
  Sender extends MetaApiSender<Agent>,
> {
  protected sender: Sender;
  private stateRepository: StateRepositoryI;
  private platformShortId: string;

  constructor(
    stateManager: StateRepositoryI,
    sender: Sender,
    platformShortId: string,
  ) {
    this.stateRepository = stateManager;
    this.sender = sender;
    this.platformShortId = platformShortId;
  }

  async setAppSubscription({
    objectType,
    webhookUrl,
    fields,
    appId,
    webhookVerifyToken,
  }: SetMetaAppSubscriptionOptions): Promise<void> {
    await this.sender.requestApi({
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
    await this.sender.requestApi({
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
    agent: string | Agent,
    resource: string,
    assetTag: string,
  ): Promise<undefined | string> {
    const existed = await this.stateRepository
      .globalState(this.makeResourceKey(agentInputId(agent), resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    agent: string | Agent,
    resource: string,
    assetTag: string,
    id: string,
  ): Promise<boolean> {
    const isUpdated = await this.stateRepository
      .globalState(this.makeResourceKey(agentInputId(agent), resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    agent: string | Agent,
    resource: string,
  ): Promise<null | Map<string, string>> {
    return this.stateRepository
      .globalState(this.makeResourceKey(agentInputId(agent), resource))
      .getAll();
  }

  async unsaveAssetId(
    agent: string | Agent,
    resource: string,
    assetTag: string,
  ): Promise<boolean> {
    const isDeleted = await this.stateRepository
      .globalState(this.makeResourceKey(agentInputId(agent), resource))
      .delete(assetTag);
    return isDeleted;
  }

  private makeResourceKey(agent: string | Agent, resource: string): string {
    return `$${this.platformShortId}.${resource}.${agentInputId(agent)}`;
  }
}

export default MetaAssetsManager;
