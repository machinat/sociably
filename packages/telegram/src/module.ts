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
  BotSettingsAccessorI,
} from './interface';
import { TELEGRAM } from './constant';
import BotP from './Bot';
import ReceiverP from './Receiver';
import TelegramUserProfile from './UserProfile';
import TelegramChatProfile from './ChatProfile';
import ProfilerP from './Profiler';
import TelegramChat from './Chat';
import TelegramUser from './User';
import TelegramChatSender from './ChatSender';
import createStaticBotSettingsAccessor from './utils/createStaticBotSettingsAccessor';
import type {
  TelegramEventContext,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramResult,
} from './types';

/** @interanl */
const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: TELEGRAM,
    path: configs.webhookPath || '/',
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

  export const BotSettingsAccessor = BotSettingsAccessorI;
  export type BotSettingsAccessor = BotSettingsAccessorI;

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

      { provide: BaseMarshaler.TypeList, withValue: TelegramChat },
      { provide: BaseMarshaler.TypeList, withValue: TelegramUser },
      { provide: BaseMarshaler.TypeList, withValue: TelegramChatSender },
      { provide: BaseMarshaler.TypeList, withValue: TelegramUserProfile },
      { provide: BaseMarshaler.TypeList, withValue: TelegramChatProfile },
    ];

    if (configs.botSettingsService) {
      provisions.push({
        provide: BotSettingsAccessorI,
        withProvider: serviceProviderFactory({
          deps: [configs.botSettingsService],
        })((accessor) => accessor),
      });
    } else if (configs.botSettings) {
      provisions.push({
        provide: BotSettingsAccessorI,
        withValue: createStaticBotSettingsAccessor([configs.botSettings]),
      });
    } else if (configs.multiBotSettings) {
      if (configs.multiBotSettings.length === 0) {
        throw new Error(
          'configs.multiBotSettings must have at least one page settings'
        );
      }

      provisions.push({
        provide: BotSettingsAccessorI,
        withValue: createStaticBotSettingsAccessor([
          ...configs.multiBotSettings,
        ]),
      });
    } else {
      throw new Error(
        'Telegram platform requires one of `botSettings`, `multiBotSettings` or `botSettingsService` option'
      );
    }

    return {
      name: TELEGRAM,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: serviceContainer({ deps: [BotP] })((bot: BotP) => bot.start()),
      stopHook: serviceContainer({ deps: [BotP] })((bot: BotP) => bot.stop()),
    };
  };
}

export default Telegram;
