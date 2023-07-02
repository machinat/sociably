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
import type { MetaApiJob, MetaApiResult } from '@sociably/meta-api';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import {
  default as WhatsAppAssetsManager,
  saveUploadedMedia,
} from './asset/index.js';
import { WHATSAPP } from './constant.js';
import BotP from './Bot.js';
import ReceiverP from './Receiver.js';
import ProfilerP from './Profiler.js';
import WhatsAppAgent from './Agent.js';
import WhatsAppChat from './Chat.js';
import WhatsAppUser from './User.js';
import WhatsAppUserProfile from './UserProfile.js';
import {
  singleStaticAgentSettingsAccessor,
  multiStaticAgentSettingsAccessor,
} from './utils/createStaticAgentSettingsAccessor.js';
import type {
  WhatsAppConfigs,
  WhatsAppEventContext,
  WhatsAppDispatchFrame,
} from './types.js';

/** @interanl */
const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: WHATSAPP,
    path: configs.webhookPath || '.',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace WhatsApp {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const AssetsManager = WhatsAppAssetsManager;
  export type AssetsManager = WhatsAppAssetsManager;

  export const AgentSettingsAccessor = AgentSettingsAccessorI;
  export type AgentSettingsAccessor = AgentSettingsAccessorI;

  export const initModule = (
    configs: WhatsAppConfigs
  ): SociablyPlatform<
    WhatsAppEventContext,
    null,
    MetaApiJob,
    WhatsAppDispatchFrame,
    MetaApiResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: WHATSAPP,
      },

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: WHATSAPP,
      },

      WhatsAppAssetsManager,

      { provide: ConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeList, withValue: WhatsAppAgent },
      { provide: BaseMarshaler.TypeList, withValue: WhatsAppChat },
      { provide: BaseMarshaler.TypeList, withValue: WhatsAppUser },
      { provide: BaseMarshaler.TypeList, withValue: WhatsAppUserProfile },
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
        withValue: singleStaticAgentSettingsAccessor(configs.agentSettings),
      });
    } else if (configs.multiAgentSettings) {
      if (configs.multiAgentSettings.length === 0) {
        throw new Error('WhatsApp platform requires at least one number');
      }

      provisions.push({
        provide: AgentSettingsAccessorI,
        withValue: multiStaticAgentSettingsAccessor(configs.multiAgentSettings),
      });
    } else {
      throw new Error(
        'WhatsApp platform requires one of `agentSettings`, `multiAgentSettings` or `agentSettingsService` option'
      );
    }

    return {
      name: WHATSAPP,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: [
        ...(configs.dispatchMiddlewares ?? []),
        saveUploadedMedia,
      ],

      startHook: serviceContainer({ deps: [BotP] })(async (bot) => bot.start()),
      stopHook: serviceContainer({ deps: [BotP] })(async (bot) => bot.stop()),
    };
  };
}

export default WhatsApp;
