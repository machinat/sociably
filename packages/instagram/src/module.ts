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
import { MetaApiJob, MetaApiResult } from '@sociably/meta-api';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import {
  default as InstagramAssetsManager,
  saveReusableAttachments,
} from './asset/index.js';
import { INSTAGRAM } from './constant.js';
import BotP from './Bot.js';
import ReceiverP from './Receiver.js';
import InstagramUserProfile from './UserProfile.js';
import ProfilerP from './Profiler.js';
import InstagramPage from './Page.js';
import InstagramChat from './Chat.js';
import InstagramUser from './User.js';
import createStaticAgentSettingsAccessor from './utils/createStaticAgentSettingsAccessor.js';
import type {
  InstagramConfigs,
  InstagramEventContext,
  InstagramDispatchFrame,
} from './types.js';

const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: INSTAGRAM,
    path: configs.webhookPath || '.',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Instagram {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const AssetsManager = InstagramAssetsManager;
  export type AssetsManager = InstagramAssetsManager;

  export const AgentSettingsAccessor = AgentSettingsAccessorI;
  export type AgentSettingsAccessor = AgentSettingsAccessorI;

  export const initModule = (
    configs: InstagramConfigs
  ): SociablyPlatform<
    InstagramEventContext,
    null,
    MetaApiJob,
    InstagramDispatchFrame,
    MetaApiResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: ConfigsI, withValue: configs },

      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: INSTAGRAM,
      },

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: INSTAGRAM,
      },

      InstagramAssetsManager,

      { provide: BaseMarshaler.TypeList, withValue: InstagramChat },
      { provide: BaseMarshaler.TypeList, withValue: InstagramUser },
      { provide: BaseMarshaler.TypeList, withValue: InstagramPage },
      { provide: BaseMarshaler.TypeList, withValue: InstagramUserProfile },
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
        'Instagram platform requires one of `agentSettings`, `multiAgentSettings` or `agentSettingsService` option'
      );
    }

    return {
      name: INSTAGRAM,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: [
        ...(configs.dispatchMiddlewares ?? []),
        saveReusableAttachments,
      ],

      startHook: serviceContainer({ deps: [BotP] })(async (bot) => bot.start()),
      stopHook: serviceContainer({ deps: [BotP] })(async (bot) => bot.stop()),
    };
  };
}

export default Instagram;
