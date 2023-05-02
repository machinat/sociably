import { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';
import BotP from '../Bot';
import TwitterUser from '../User';
import { TWTR } from '../constant';
import { RenderMediaResponse } from '../types';

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
    agent: TwitterUser,
    resource: string,
    tag: string
  ): Promise<undefined | string> {
    const existed = await this._stateController
      .globalState(makeResourceToken(agent.id, resource))
      .get<string>(tag);
    return existed || undefined;
  }

  async saveAssetId(
    agent: TwitterUser,
    resource: string,
    tag: string,
    id: string
  ): Promise<boolean> {
    const isUpdated = await this._stateController
      .globalState(makeResourceToken(agent.id, resource))
      .set<string>(tag, id);
    return isUpdated;
  }

  getAllAssets(
    agent: TwitterUser,
    resource: string
  ): Promise<null | Map<string, string>> {
    return this._stateController
      .globalState(makeResourceToken(agent.id, resource))
      .getAll();
  }

  async unsaveAssetId(
    agent: TwitterUser,
    resource: string,
    tag: string
  ): Promise<boolean> {
    const isDeleted = await this._stateController
      .globalState(makeResourceToken(agent.id, resource))
      .delete(tag);

    return isDeleted;
  }

  // media
  getMedia(agent: TwitterUser, tag: string): Promise<undefined | string> {
    return this.getAssetId(agent, MEDIA, tag);
  }

  saveMedia(agent: TwitterUser, tag: string, id: string): Promise<boolean> {
    return this.saveAssetId(agent, MEDIA, tag, id);
  }

  getAllMedia(agent: TwitterUser): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, MEDIA);
  }

  unsaveMedia(agent: TwitterUser, tag: string): Promise<boolean> {
    return this.unsaveAssetId(agent, MEDIA, tag);
  }

  async renderMedia(
    agent: TwitterUser,
    tag: string,
    media: SociablyNode
  ): Promise<RenderMediaResponse> {
    const existedId = await this.getMedia(agent, tag);
    if (existedId) {
      throw new Error(`media [${tag}] already exists`);
    }

    const results = await this._bot.renderMedia(agent, media);
    if (!results) {
      throw new Error('media content is empty');
    }

    const result = results[0];
    this.saveMedia(agent, tag, result.id);

    return result;
  }

  // welcome message
  getWelcomeMessage(
    agent: TwitterUser,
    tag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, WELCOME_MESSAGE, tag);
  }

  saveWelcomeMessage(
    agent: TwitterUser,
    tag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, WELCOME_MESSAGE, tag, id);
  }

  getAllWelcomeMessages(
    agent: TwitterUser
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, WELCOME_MESSAGE);
  }

  unsaveWelcomeMessage(agent: TwitterUser, tag: string): Promise<boolean> {
    return this.unsaveAssetId(agent, WELCOME_MESSAGE, tag);
  }

  async renderWelcomeMessage(
    agent: TwitterUser,
    tag: string,
    message: SociablyNode
  ): Promise<undefined | string> {
    const existedId = await this.getWelcomeMessage(agent, tag);
    if (existedId) {
      throw new Error(`welcome message [${tag}] already exists`);
    }

    const result = await this._bot.renderWelcomeMessage(agent, tag, message);
    if (!result) {
      throw new Error('message content is empty');
    }

    const { id: welcomeId } = result.welcome_message;
    await this.saveAssetId(agent, WELCOME_MESSAGE, tag, welcomeId);
    return welcomeId;
  }

  async deleteWelcomeMessage(agent: TwitterUser, tag: string): Promise<string> {
    const welcomeId = await this.getWelcomeMessage(agent, tag);
    if (!welcomeId) {
      throw new Error(`welcome message [${tag}] doesn't exist`);
    }

    await this._bot.requestApi({
      agent,
      method: 'DELETE',
      url: `1.1/direct_messages/welcome_messages/destroy.json`,
      params: { id: welcomeId },
    });
    await this.unsaveWelcomeMessage(agent, tag);
    return welcomeId;
  }

  // custome profile
  getCustomProfile(
    agent: TwitterUser,
    tag: string
  ): Promise<undefined | string> {
    return this.getAssetId(agent, CUSTOM_PROFILE, tag);
  }

  saveCustomProfile(
    agent: TwitterUser,
    tag: string,
    id: string
  ): Promise<boolean> {
    return this.saveAssetId(agent, CUSTOM_PROFILE, tag, id);
  }

  getAllCustomProfiles(
    agent: TwitterUser
  ): Promise<null | Map<string, string>> {
    return this.getAllAssets(agent, CUSTOM_PROFILE);
  }

  unsaveCustomProfile(agent: TwitterUser, tag: string): Promise<boolean> {
    return this.unsaveAssetId(agent, CUSTOM_PROFILE, tag);
  }

  async createCustomProfile(
    agent: TwitterUser,
    tag: string,
    name: string,
    mediaId: string
  ): Promise<string> {
    const existedId = await this.getCustomProfile(agent, tag);
    if (existedId) {
      throw new Error(`custom profile [${tag}] already exists`);
    }

    const {
      custom_profile: { id: customProfileId },
    } = await this._bot.requestApi<CreateCustomProfileResult>({
      agent,
      method: 'POST',
      url: `1.1/custom_profiles/new.json`,
      params: {
        custom_profile: {
          name,
          avatar: { media: { id: mediaId } },
        },
      },
    });

    await this.saveCustomProfile(agent, tag, customProfileId);
    return customProfileId;
  }

  async deleteCustomProfile(agent: TwitterUser, tag: string): Promise<string> {
    const customProfileId = await this.getCustomProfile(agent, tag);
    if (!customProfileId) {
      throw new Error(`custom profile [${tag}] doesn't exist`);
    }

    await this._bot.requestApi({
      agent,
      method: 'DELETE',
      url: `1.1/custom_profiles/destroy.json`,
      params: { id: customProfileId },
    });
    await this.unsaveCustomProfile(agent, tag);
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
