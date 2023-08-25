import { serviceProviderClass, StateController } from '@sociably/core';
import Http from '@sociably/http';
import BotP from '../Bot.js';
import TelegramUser from '../User.js';
import { ConfigsI } from '../interface.js';
import { TG } from '../constant.js';

const FILE = 'file';

const makeResourceToken = (botId: number, resource: string): string =>
  `$${TG}.${resource}.${botId}`;

type DefaultSettings = {
  secretToken?: string;
  webhookUrl?: string;
};

/**
 * TelegramAssetsManager stores name-to-id mapping for assets created in
 * Telegram platform.
 * @category Provider
 */
export class TelegramAssetsManager {
  private stateController: StateController;
  private bot: BotP;
  defaultSettings: DefaultSettings;

  constructor(
    bot: BotP,
    stateController: StateController,
    defaultSettings: DefaultSettings = {}
  ) {
    this.bot = bot;
    this.stateController = stateController;
    this.defaultSettings = defaultSettings;
  }

  async getAssetId(
    agent: number | TelegramUser,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const agentId = typeof agent === 'number' ? agent : agent.id;
    const existed = await this.stateController
      .globalState(makeResourceToken(agentId, resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    agent: number | TelegramUser,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const agentId = typeof agent === 'number' ? agent : agent.id;
    const isUpdated = await this.stateController
      .globalState(makeResourceToken(agentId, resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    agent: number | TelegramUser,
    resource: string
  ): Promise<null | Map<string, string>> {
    const agentId = typeof agent === 'number' ? agent : agent.id;
    return this.stateController
      .globalState(makeResourceToken(agentId, resource))
      .getAll();
  }

  async unsaveAssetId(
    agent: number | TelegramUser,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const agentId = typeof agent === 'number' ? agent : agent.id;

    const isDeleted = await this.stateController
      .globalState(makeResourceToken(agentId, resource))
      .delete(assetTag);
    return isDeleted;
  }

  getFile(
    agent: number | TelegramUser,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, FILE, assetTag);
  }

  saveFile(
    agent: number | TelegramUser,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, FILE, assetTag, id);
  }

  getAllFiles(
    agent: number | TelegramUser
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, FILE);
  }

  unsaveFile(agent: number | TelegramUser, assetTag: string): Promise<boolean> {
    return this.unsaveAssetId(agent, FILE, assetTag);
  }

  /**
   * Use this method to specify a URL and receive incoming updates via an outgoing webhook.
   * Whenever there is an update for the bot, we will send an HTTPS POST request to the
   * specified URL, containing a JSON-serialized Update. In case of an unsuccessful request,
   * we will give up after a reasonable amount of attempts. Returns True on success.
   * If you'd like to make sure that the webhook was set by you, you can specify secret data
   * in the parameter secret_token. If specified, the request will contain a header
   * `X-Telegram-Bot-Api-Secret-Token` with the secret token as content.
   */
  async setBotWebhook(
    agent: number | TelegramUser,
    params: {
      /** HTTPS URL to send updates to. Use an empty string to remove webhook integration */
      url?: string;
      /**
       * The fixed IP address which will be used to send webhook requests instead of the IP
       * address resolved through DNS
       */
      ipAddress?: string;
      /**
       * The maximum allowed number of simultaneous HTTPS connections to the webhook for update
       * delivery, 1-100. Defaults to 40. Use lower values to limit the load on your bot's
       * server, and higher values to increase your bot's throughput.
       */
      maxConnections?: number;
      /**
       * A list of the update types you want your bot to receive. Specify an empty list to receive
       * all update types except chat_member (default). If not specified, the previous setting will
       * be used. Please note that this parameter doesn't affect updates created before the call to
       * the setWebhook, so unwanted updates may be received for a short period of time.
       * @example ['message', 'edited_channel_post', 'callback_query']
       */
      allowedUpdates?: string[];
      /** Pass True to drop all pending updates */
      dropPendingUpdates?: boolean;
      /**
       * A secret token to be sent in a header `X-Telegram-Bot-Api-Secret-Token` in every webhook
       * request, 1-256 characters. Only characters A-Z, a-z, 0-9, _ and - are allowed. The header
       * is useful to ensure that the request comes from a webhook set by you.
       */
      secretToken?: string;
    } = {}
  ): Promise<void> {
    const webhookUrl = params.url || this.defaultSettings.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Webhook url is required');
    }
    const agentId = typeof agent === 'number' ? agent : agent.id;

    await this.bot.requestApi({
      channel: agent,
      method: 'setWebhook',
      params: {
        url: `${webhookUrl}/${agentId}`,
        ip_address: params.ipAddress,
        max_connections: params.maxConnections,
        allowed_updates: params.allowedUpdates,
        drop_pending_updates: params.dropPendingUpdates,
        secret_token: params.secretToken || this.defaultSettings.secretToken,
      },
    });
  }

  /** Remove a webhook integration */
  async deleteBotWebhook(
    agent: number | TelegramUser,
    params?: {
      /** Pass True to drop all pending updates */
      dropPendingUpdates?: boolean;
    }
  ): Promise<void> {
    await this.bot.requestApi({
      channel: agent,
      method: 'deleteWebhook',
      params: {
        drop_pending_updates: !!params?.dropPendingUpdates,
      },
    });
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP, StateController, Http.Connector, ConfigsI],
  factory: (bot, stateController, connector, { webhookPath, secretToken }) =>
    new TelegramAssetsManager(bot, stateController, {
      webhookUrl: connector.getServerUrl(webhookPath),
      secretToken,
    }),
})(TelegramAssetsManager);

type AssetsManagerP = TelegramAssetsManager;

export default AssetsManagerP;
