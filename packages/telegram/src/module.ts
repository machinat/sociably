import type { MachinatPlatform } from '@machinat/core';
import type { ServiceProvision } from '@machinat/core/service';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http';

import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TELEGRAM } from './constant';
import BotP from './Bot';
import ReceiverP from './Receiver';
import TelegramUserProfile from './UserProfile';
import TelegramChatProfile from './ChatProfile';
import ProfilerP from './Profiler';
import TelegramChat from './Chat';
import TelegramChatTarget from './ChatTarget';
import TelegramUser from './User';
import type {
  TelegramEventContext,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramResult,
} from './types';

/** @interanl */
const webhookRouteFactory = makeFactoryProvider({
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

      startHook: makeContainer({ deps: [BotP] })(async (bot: BotP) =>
        bot.start()
      ),
      stopHook: makeContainer({ deps: [BotP] })(async (bot: BotP) =>
        bot.stop()
      ),
    };
  };
}

export default Telegram;
