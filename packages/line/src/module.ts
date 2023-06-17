import type { SociablyPlatform } from '@sociably/core';
import {
  serviceContainer,
  serviceProviderFactory,
  ServiceProvision,
} from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http, { RequestRoute } from '@sociably/http';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import { default as LineAssetsManager } from './asset/index.js';
import { LINE } from './constant.js';
import ReceiverP from './Receiver.js';
import BotP from './Bot.js';
import LineUserProfile from './UserProfile.js';
import LineGroupProfile from './GroupProfile.js';
import ProfilerP from './Profiler.js';
import LineChannel from './Channel.js';
import LineChat from './Chat.js';
import LineUser from './User.js';
import {
  createSingleStaticAgentSettingsAccessor,
  createMultiStaticNumberSettingsAccessor,
} from './utils/staticAgentSettingsAccessor.js';
import type {
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineResult,
} from './types.js';

const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: LINE,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Line {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const AssetsManager = LineAssetsManager;
  export type AssetsManager = LineAssetsManager;

  export const AgentSettingsAccessor = AgentSettingsAccessorI;
  export type AgentSettingsAccessor = AgentSettingsAccessorI;

  export const initModule = (
    configs: ConfigsI
  ): SociablyPlatform<
    LineEventContext,
    null,
    LineJob,
    LineDispatchFrame,
    LineResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: LINE,
      },

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: LINE,
      },

      LineAssetsManager,

      { provide: ConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeList, withValue: LineChannel },
      { provide: BaseMarshaler.TypeList, withValue: LineChat },
      { provide: BaseMarshaler.TypeList, withValue: LineUser },
      { provide: BaseMarshaler.TypeList, withValue: LineUserProfile },
      { provide: BaseMarshaler.TypeList, withValue: LineGroupProfile },
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
        withValue: createSingleStaticAgentSettingsAccessor(
          configs.agentSettings
        ),
      });
    } else if (configs.multiAgentSettings) {
      if (configs.multiAgentSettings.length === 0) {
        throw new Error('configs.multiAgentSettings must not be empty');
      }

      provisions.push({
        provide: AgentSettingsAccessorI,
        withValue: createMultiStaticNumberSettingsAccessor([
          ...configs.multiAgentSettings,
        ]),
      });
    } else {
      throw new Error(
        'Line platform requires one of `agentSettings`, `multiAgentSettings` or `agentSettingsService` option'
      );
    }

    return {
      name: LINE,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: serviceContainer({ deps: [BotP] })((bot) => bot.start()),
      stopHook: serviceContainer({ deps: [BotP] })((bot) => bot.stop()),
    };
  };
}

export default Line;
