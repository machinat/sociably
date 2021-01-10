import type { PlatformModule } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseProfiler, BaseMarshaler } from '@machinat/core/base';
import Http from '@machinat/http';
import type { HttpRequestRouting } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
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
  TelegramPlatformConfigs,
  TelegramEventContext,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramAPIResult,
} from './types';

/** @interanl */
const requestRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP] as const,
})(
  (configs, receiver): HttpRequestRouting => ({
    name: TELEGRAM,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Telegram = {
  Bot: BotP,
  Receiver: ReceiverP,
  Profiler: ProfilerP,
  CONFIGS_I: PLATFORM_CONFIGS_I,

  initModule: (
    configs: TelegramPlatformConfigs
  ): PlatformModule<
    TelegramEventContext,
    null,
    TelegramJob,
    TelegramDispatchFrame,
    TelegramAPIResult
  > => {
    const provisions: ServiceProvision<any>[] = [
      BotP,
      {
        provide: BaseBot.PLATFORMS_I,
        withProvider: BotP,
        platform: TELEGRAM,
      },

      ProfilerP,
      {
        provide: BaseProfiler.PLATFORMS_I,
        withProvider: ProfilerP,
        platform: TELEGRAM,
      },

      { provide: PLATFORM_CONFIGS_I, withValue: configs },
      { provide: BaseMarshaler.TYPINGS_I, withValue: TelegramChat },
      { provide: BaseMarshaler.TYPINGS_I, withValue: TelegramChatInstance },
      { provide: BaseMarshaler.TYPINGS_I, withValue: TelegramChatTarget },
      { provide: BaseMarshaler.TYPINGS_I, withValue: TelegramUser },
      { provide: BaseMarshaler.TYPINGS_I, withValue: TelegramUserProfile },
      { provide: BaseMarshaler.TYPINGS_I, withValue: TelegramChatProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.REQUEST_ROUTINGS_I,
        withProvider: requestRoutingFactory,
      });
    }

    return {
      name: TELEGRAM,
      mounterInterface: PLATFORM_MOUNTER_I,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: makeContainer({
        deps: [BotP],
      })(async (bot: BotP) => bot.start()),
    };
  },
};

declare namespace Telegram {
  export type Bot = BotP;
  export type Receiver = ReceiverP;
  export type Profiler = ProfilerP;
}

export default Telegram;
