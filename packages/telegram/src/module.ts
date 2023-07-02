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
  default as TelegramAssetsManager,
  saveUploadedFile,
} from './asset/index.js';
import { TELEGRAM } from './constant.js';
import BotP from './Bot.js';
import ReceiverP from './Receiver.js';
import TelegramUserProfile from './UserProfile.js';
import TelegramChatProfile from './ChatProfile.js';
import ProfilerP from './Profiler.js';
import TelegramChat from './Chat.js';
import TelegramUser from './User.js';
import TelegramChatSender from './ChatSender.js';
import createStaticAgentSettingsAccessor from './utils/createStaticAgentSettingsAccessor.js';
import type {
  TelegramEventContext,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramResult,
} from './types.js';

/** @interanl */
const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: TELEGRAM,
    path: configs.webhookPath || '.',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Telegram {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const AssetsManager = TelegramAssetsManager;
  export type AssetsManager = TelegramAssetsManager;

  export const AgentSettingsAccessor = AgentSettingsAccessorI;
  export type AgentSettingsAccessor = AgentSettingsAccessorI;

  export const initModule = (
    configs: ConfigsI
  ): SociablyPlatform<
    TelegramEventContext,
    null,
    TelegramJob,
    TelegramDispatchFrame,
    TelegramResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: ConfigsI, withValue: configs },

      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: TELEGRAM,
      },

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: TELEGRAM,
      },

      TelegramAssetsManager,

      { provide: BaseMarshaler.TypeList, withValue: TelegramChat },
      { provide: BaseMarshaler.TypeList, withValue: TelegramUser },
      { provide: BaseMarshaler.TypeList, withValue: TelegramChatSender },
      { provide: BaseMarshaler.TypeList, withValue: TelegramUserProfile },
      { provide: BaseMarshaler.TypeList, withValue: TelegramChatProfile },
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
        'Telegram platform requires one of `agentSettings`, `multiAgentSettings` or `agentSettingsService` option'
      );
    }

    return {
      name: TELEGRAM,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: [
        ...(configs.dispatchMiddlewares ?? []),
        saveUploadedFile,
      ],

      startHook: serviceContainer({ deps: [BotP] })((bot: BotP) => bot.start()),
      stopHook: serviceContainer({ deps: [BotP] })((bot: BotP) => bot.stop()),
    };
  };
}

export default Telegram;
