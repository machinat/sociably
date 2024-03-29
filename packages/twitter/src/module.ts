import type { SociablyPlatform } from '@sociably/core';
import {
  serviceContainer,
  serviceProviderFactory,
  ServiceProvision,
} from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import type { RequestRoute } from '@sociably/http';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import {
  default as TwitterAssetsManager,
  saveUploadedMedia,
} from './asset/index.js';
import { TWITTER } from './constant.js';
import BotP from './Bot.js';
import ReceiverP from './Receiver.js';
import ProfilerP from './Profiler.js';
import TwitterUserProfile from './UserProfile.js';
import TwitterChat from './Chat.js';
import TweetTarget from './TweetTarget.js';
import TwitterUser from './User.js';
import createStaticAgentSettingsAccessor from './utils/createStaticAgentSettingsAccessor.js';
import type {
  TwitterEventContext,
  TwitterJob,
  TwitterDispatchFrame,
  TwitterApiResult,
} from './types.js';

/** @interanl */
const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: TWITTER,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Twitter {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const AssetsManager = TwitterAssetsManager;
  export type AssetsManager = TwitterAssetsManager;

  export const AgentSettingsAccessor = AgentSettingsAccessorI;
  export type AgentSettingsAccessor = AgentSettingsAccessorI;

  export const initModule = (
    configs: ConfigsI
  ): SociablyPlatform<
    TwitterEventContext,
    null,
    TwitterJob,
    TwitterDispatchFrame,
    TwitterApiResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: ConfigsI, withValue: configs },
      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: TWITTER,
      },

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: TWITTER,
      },

      TwitterAssetsManager,

      { provide: BaseMarshaler.TypeList, withValue: TwitterChat },
      { provide: BaseMarshaler.TypeList, withValue: TweetTarget },
      { provide: BaseMarshaler.TypeList, withValue: TwitterUser },
      { provide: BaseMarshaler.TypeList, withValue: TwitterUserProfile },
    ];

    if (configs.agentSettingsService) {
      provisions.push({
        provide: AgentSettingsAccessorI,
        withProvider: serviceProviderFactory({
          deps: [configs.agentSettingsService],
        })((accessor) => accessor),
      });
    } else if (configs.agentSettings) {
      provisions.push({
        provide: AgentSettingsAccessorI,
        withValue: createStaticAgentSettingsAccessor([configs.agentSettings]),
      });
    } else if (configs.multiAgentSettings) {
      if (configs.multiAgentSettings.length === 0) {
        throw new Error(
          'configs.multiAgentSettings must have at least one page settings'
        );
      }

      provisions.push({
        provide: AgentSettingsAccessorI,
        withValue: createStaticAgentSettingsAccessor([
          ...configs.multiAgentSettings,
        ]),
      });
    } else {
      throw new Error(
        'Twitter platform requires one of `agentSettings`, `multiAgentSettings` or `agentSettingsService` option'
      );
    }

    return {
      name: TWITTER,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: [
        ...(configs.dispatchMiddlewares ?? []),
        saveUploadedMedia,
      ],

      startHook: serviceContainer({ deps: [BotP] })((bot: BotP) => bot.start()),
      stopHook: serviceContainer({ deps: [BotP] })((bot: BotP) => bot.stop()),
    };
  };
}

export default Twitter;
