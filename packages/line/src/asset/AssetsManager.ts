import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import fetch from 'node-fetch';
import LineChannel from '../Channel.js';
import BotP from '../Bot.js';
import { AgentSettingsAccessorI } from '../interface.js';
import { PATH_RICHMENU, LINE } from '../constant.js';
import LineApiError from '../error.js';

const RICH_MENU = 'rich_menu';

const resourceToken = (channelId: string, resource: string) =>
  `$${LINE}.${resource}.${channelId}`;

/**
 * @category Provider
 */
export class LineAssetsManager {
  private _stateController: StateControllerI;
  private _settingsAccessor: AgentSettingsAccessorI;
  private _bot: BotP;

  constructor(
    stateManger: StateControllerI,
    bot: BotP,
    settingsAccessor: AgentSettingsAccessorI
  ) {
    this._stateController = stateManger;
    this._settingsAccessor = settingsAccessor;
    this._bot = bot;
  }

  async getAssetId(
    channel: string | LineChannel,
    resource: string,
    name: string
  ): Promise<undefined | string> {
    const channelId = typeof channel === 'string' ? channel : channel.id;
    const existed = await this._stateController
      .globalState(resourceToken(channelId, resource))
      .get<string>(name);

    return existed || undefined;
  }

  async saveAssetId(
    channel: string | LineChannel,
    resource: string,
    name: string,
    id: string
  ): Promise<boolean> {
    const channelId = typeof channel === 'string' ? channel : channel.id;
    const isUpdated = await this._stateController
      .globalState(resourceToken(channelId, resource))
      .set<string>(name, id);

    return isUpdated;
  }

  getAllAssets(
    channel: string | LineChannel,
    resource: string
  ): Promise<null | Map<string, string>> {
    const channelId = typeof channel === 'string' ? channel : channel.id;
    return this._stateController
      .globalState(resourceToken(channelId, resource))
      .getAll();
  }

  async unsaveAssetId(
    channel: string | LineChannel,
    resource: string,
    name: string
  ): Promise<boolean> {
    const channelId = typeof channel === 'string' ? channel : channel.id;
    const isDeleted = await this._stateController
      .globalState(resourceToken(channelId, resource))
      .delete(name);

    return isDeleted;
  }

  getRichMenu(
    channel: string | LineChannel,
    name: string
  ): Promise<undefined | string> {
    return this.getAssetId(channel, RICH_MENU, name);
  }

  saveRichMenu(
    channel: string | LineChannel,
    name: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(channel, RICH_MENU, name, id);
  }

  getAllRichMenus(
    channel: string | LineChannel
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(channel, RICH_MENU);
  }

  unsaveRichMenu(
    channel: string | LineChannel,
    name: string
  ): Promise<boolean> {
    return this.unsaveAssetId(channel, RICH_MENU, name);
  }

  async createRichMenu(
    channelInput: string | LineChannel,
    name: string,
    content: NodeJS.ReadableStream | Buffer,
    params: Record<string, unknown>,
    {
      asDefault,
      contentType,
    }: { asDefault?: boolean; contentType?: string } = {}
  ): Promise<{ richMenuId: string }> {
    const channel =
      typeof channelInput === 'string'
        ? new LineChannel(channelInput)
        : channelInput;

    // check if rich menu already exist
    const existed = await this.getRichMenu(channel, name);
    if (existed) {
      throw new Error(`rich menu [ ${name} ] already exist`);
    }

    // create rich menu
    const { richMenuId } = await this._bot.requestApi<{ richMenuId: string }>({
      method: 'POST',
      url: PATH_RICHMENU,
      params,
      channel,
    });

    // upload rich menu image
    const settings = await this._settingsAccessor.getAgentSettings(channel);
    if (!settings) {
      throw new Error(`Line channel "${channel.uid}" not registered`);
    }
    const uploadRes = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
          'Content-Type': contentType,
        } as Record<string, string>,
        body: content,
      }
    );
    const uploadBody = await uploadRes.json();
    if (uploadRes.status >= 300) {
      throw new LineApiError({
        code: uploadRes.status,
        headers: Object.fromEntries(uploadRes.headers),
        body: uploadBody as Record<string, unknown>,
      });
    }

    // set to default rich menu if asDefault
    if (asDefault) {
      await this._bot.requestApi({
        channel,
        method: 'POST',
        url: `/v2/bot/user/all/richmenu/${richMenuId}`,
      });
    }

    await this.saveAssetId(channel, RICH_MENU, name, richMenuId);
    return { richMenuId };
  }

  async deleteRichMenu(
    channel: string | LineChannel,
    name: string
  ): Promise<boolean> {
    const id = await this.getRichMenu(channel, name);
    if (id === undefined) {
      return false;
    }

    await this._bot.requestApi({
      method: 'DELETE',
      url: `${PATH_RICHMENU}/${id}`,
      channel,
    });

    await this.unsaveAssetId(channel, RICH_MENU, name);
    return true;
  }

  async setChannelWebhook(
    channel: string | LineChannel,
    { url: webhookUrl }: { url: string }
  ): Promise<void> {
    await this._bot.requestApi({
      channel,
      method: 'PUT',
      url: 'v2/bot/channel/webhook/endpoint',
      params: {
        endpoint: webhookUrl,
      },
    });
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, BotP],
})(LineAssetsManager);

type AssetsManagerP = LineAssetsManager;

export default AssetsManagerP;
