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
  default as FacebookAssetsManager,
  saveReusableAttachments,
} from './asset/index.js';
import { FACEBOOK } from './constant.js';
import BotP from './Bot.js';
import ReceiverP from './Receiver.js';
import FacebookUserProfile from './UserProfile.js';
import ProfilerP from './Profiler.js';
import FacebookPage from './Page.js';
import FacebookChat from './Chat.js';
import FacebookUser from './User.js';
import createStaticAgentSettingsAccessor from './utils/createStaticAgentSettingsAccessor.js';
import type {
  FacebookConfigs,
  FacebookEventContext,
  FacebookDispatchFrame,
} from './types.js';

const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: FACEBOOK,
    path: configs.webhookPath || '.',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Facebook {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const AssetsManager = FacebookAssetsManager;
  export type AssetsManager = FacebookAssetsManager;

  export const AgentSettingsAccessor = AgentSettingsAccessorI;
  export type AgentSettingsAccessor = AgentSettingsAccessorI;

  export const initModule = (
    configs: FacebookConfigs
  ): SociablyPlatform<
    FacebookEventContext,
    null,
    MetaApiJob,
    FacebookDispatchFrame,
    MetaApiResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: ConfigsI, withValue: configs },

      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: FACEBOOK,
      },

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: FACEBOOK,
      },

      FacebookAssetsManager,

      { provide: BaseMarshaler.TypeList, withValue: FacebookChat },
      { provide: BaseMarshaler.TypeList, withValue: FacebookUser },
      { provide: BaseMarshaler.TypeList, withValue: FacebookPage },
      { provide: BaseMarshaler.TypeList, withValue: FacebookUserProfile },
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
        'Facebook platform requires one of `agentSettings`, `multiAgentSettings` or `agentSettingsService` option'
      );
    }

    return {
      name: FACEBOOK,
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

export default Facebook;
