import { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import BotP from '../Bot.js';
import TwitterUser from '../User.js';
import { TWTR } from '../constant.js';
import { RenderMediaResponse } from '../types.js';

const MEDIA = 'media';
const WELCOME_MESSAGE = 'welcome_message';
const CUSTOM_PROFILE = 'custom_profile';

/* eslint-disable camelcase */
type CreateCustomProfileResult = {
  custom_profile: {
    id: string;
    created_timestamp: string;
    name: string;
    avatar: {
      media: { url: string };
    };
  };
};
/* eslint-enable camelcase */

const makeResourceToken = (agentId: string, resource: string): string =>
  `$${TWTR}.${resource}.${agentId}`;

/**
 * TwitterAssetsManager stores ids of assets created at Twitter platform.
 * @category Provider
 */
export class TwitterAssetsManager {
  private _bot: BotP;
  private _stateController: StateControllerI;

  constructor(bot: BotP, stateManager: StateControllerI) {
    this._stateController = stateManager;
    this._bot = bot;
  }

  async getAssetId(
    agent: string | TwitterUser,
    resource: string,
    assetTag: string
  ): Promise<undefined | string> {
    const agentId = typeof agent === 'string' ? agent : agent.id;
    const existed = await this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .get<string>(assetTag);
    return existed || undefined;
  }

  async saveAssetId(
    agent: string | TwitterUser,
    resource: string,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    const agentId = typeof agent === 'string' ? agent : agent.id;
    const isUpdated = await this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .set<string>(assetTag, id);
    return isUpdated;
  }

  getAllAssets(
    agent: string | TwitterUser,
    resource: string
  ): Promise<null | Map<string, string>> {
    const agentId = typeof agent === 'string' ? agent : agent.id;
    return this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .getAll();
  }

  async unsaveAssetId(
    agent: string | TwitterUser,
    resource: string,
    assetTag: string
  ): Promise<boolean> {
    const agentId = typeof agent === 'string' ? agent : agent.id;
    const isDeleted = await this._stateController
      .globalState(makeResourceToken(agentId, resource))
      .delete(assetTag);

    return isDeleted;
  }

  // media
  getMedia(
    agent: string | TwitterUser,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, MEDIA, assetTag);
  }

  saveMedia(
    agent: string | TwitterUser,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, MEDIA, assetTag, id);
  }

  getAllMedia(
    agent: string | TwitterUser
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, MEDIA);
  }

  unsaveMedia(agent: string | TwitterUser, assetTag: string): Promise<boolean> {
    return this.unsaveAssetId(agent, MEDIA, assetTag);
  }

  async uploadMedia(
    agent: string | TwitterUser,
    assetTag: string,
    media: SociablyNode
  ): Promise<RenderMediaResponse> {
    const results = await this._bot.uploadMedia(agent, media);
    if (!results) {
      throw new Error('media content is empty');
    }

    const result = results[0];
    this.saveMedia(agent, assetTag, result.id);

    return result;
  }

  // welcome message
  getWelcomeMessage(
    agent: string | TwitterUser,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, WELCOME_MESSAGE, assetTag);
  }

  saveWelcomeMessage(
    agent: string | TwitterUser,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, WELCOME_MESSAGE, assetTag, id);
  }

  getAllWelcomeMessages(
    agent: string | TwitterUser
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, WELCOME_MESSAGE);
  }

  unsaveWelcomeMessage(
    agent: string | TwitterUser,
    assetTag: string
  ): Promise<boolean> {
    return this.unsaveAssetId(agent, WELCOME_MESSAGE, assetTag);
  }

  async createWelcomeMessage(
    agent: string | TwitterUser,
    assetTag: string,
    message: SociablyNode
  ): Promise<undefined | string> {
    const result = await this._bot.createWelcomeMessage(
      agent,
      assetTag,
      message
    );
    if (!result) {
      throw new Error('message content is empty');
    }

    const { id: welcomeId } = result.welcome_message;
    await this.saveAssetId(agent, WELCOME_MESSAGE, assetTag, welcomeId);
    return welcomeId;
  }

  async deleteWelcomeMessage(
    agent: string | TwitterUser,
    assetTag: string
  ): Promise<string> {
    const welcomeId = await this.getWelcomeMessage(agent, assetTag);
    if (!welcomeId) {
      throw new Error(`welcome message [${assetTag}] doesn't exist`);
    }

    await this._bot.requestApi({
      channel: agent,
      method: 'DELETE',
      url: `1.1/direct_messages/welcome_messages/destroy.json`,
      params: { id: welcomeId },
    });
    await this.unsaveWelcomeMessage(agent, assetTag);
    return welcomeId;
  }

  // custome profile
  getCustomProfile(
    agent: string | TwitterUser,
    assetTag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, CUSTOM_PROFILE, assetTag);
  }

  saveCustomProfile(
    agent: string | TwitterUser,
    assetTag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, CUSTOM_PROFILE, assetTag, id);
  }

  getAllCustomProfiles(
    agent: string | TwitterUser
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, CUSTOM_PROFILE);
  }

  unsaveCustomProfile(
    agent: string | TwitterUser,
    assetTag: string
  ): Promise<boolean> {
    return this.unsaveAssetId(agent, CUSTOM_PROFILE, assetTag);
  }

  async createCustomProfile(
    agent: string | TwitterUser,
    assetTag: string,
    name: string,
    mediaId: string
  ): Promise<string> {
    const {
      custom_profile: { id: customProfileId },
    } = await this._bot.requestApi<CreateCustomProfileResult>({
      channel: agent,
      method: 'POST',
      url: `1.1/custom_profiles/new.json`,
      params: {
        custom_profile: {
          name,
          avatar: { media: { id: mediaId } },
        },
      },
    });

    await this.saveCustomProfile(agent, assetTag, customProfileId);
    return customProfileId;
  }

  async deleteCustomProfile(
    agent: string | TwitterUser,
    assetTag: string
  ): Promise<string> {
    const customProfileId = await this.getCustomProfile(agent, assetTag);
    if (!customProfileId) {
      throw new Error(`custom profile [${assetTag}] doesn't exist`);
    }

    await this._bot.requestApi({
      channel: agent,
      method: 'DELETE',
      url: `1.1/custom_profiles/destroy.json`,
      params: { id: customProfileId },
    });
    await this.unsaveCustomProfile(agent, assetTag);
    return customProfileId;
  }
}

const AssetsManagerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP, StateControllerI],
  factory: (bot, stateController) =>
    new TwitterAssetsManager(bot, stateController),
})(TwitterAssetsManager);

type AssetsManagerP = TwitterAssetsManager;

export default AssetsManagerP;
