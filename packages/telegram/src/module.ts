import type { MachinatPlatform } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';

import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TELEGRAM } from './constant';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import {
  ProfilerP,
  TelegramUserProfile,
  TelegramChatProfile,
} from './profiler';
import {
  TelegramChat,
  TelegramChatInstance,
  TelegramChatTarget,
} from './channel';
import TelegramUser from './user';
import type {
  TelegramEventContext,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramResult,
} from './types';

/** @interanl */
const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP] as const,
})(
  (configs, receiver): RequestRoute => ({
    name: TELEGRAM,
    path: configs.entryPath || '/',
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

  export const initModule = (
    configs: ConfigsI
  ): MachinatPlatform<
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

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: TELEGRAM,
      },

      { provide: BaseMarshaler.TypeList, withValue: TelegramChat },
      { provide: BaseMarshaler.TypeList, withValue: TelegramChatInstance },
      { provide: BaseMarshaler.TypeList, withValue: TelegramChatTarget },

      { provide: BaseMarshaler.TypeList, withValue: TelegramUser },
      { provide: BaseMarshaler.TypeList, withValue: TelegramUserProfile },
      { provide: BaseMarshaler.TypeList, withValue: TelegramChatProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.RequestRouteList,
        withProvider: webhookRouteFactory,
      });
    }

    return {
      name: TELEGRAM,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: makeContainer({
        deps: [BotP],
      })(async (bot: BotP) => bot.start()),
    };
  };
}

export default Telegram;
