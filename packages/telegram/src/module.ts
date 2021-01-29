import type { PlatformModule } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseProfiler, BaseMarshaler } from '@machinat/core/base';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';

import { ConfigsI as TelegramConfigsI, PlatformMounterI } from './interface';
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
  deps: [TelegramConfigsI, ReceiverP] as const,
})(
  (configs, receiver): RequestRoute => ({
    name: TELEGRAM,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Telegram = {
  Bot: BotP,
  Receiver: ReceiverP,
  Profiler: ProfilerP,
  ConfigsI: TelegramConfigsI,

  initModule: (
    configs: TelegramConfigsI
  ): PlatformModule<
    TelegramEventContext,
    null,
    TelegramJob,
    TelegramDispatchFrame,
    TelegramResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: TelegramConfigsI, withValue: configs },
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

      { provide: BaseMarshaler.TypeI, withValue: TelegramChat },
      { provide: BaseMarshaler.TypeI, withValue: TelegramChatInstance },
      { provide: BaseMarshaler.TypeI, withValue: TelegramChatTarget },

      { provide: BaseMarshaler.TypeI, withValue: TelegramUser },
      { provide: BaseMarshaler.TypeI, withValue: TelegramUserProfile },
      { provide: BaseMarshaler.TypeI, withValue: TelegramChatProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.RequestRouteList,
        withProvider: webhookRouteFactory,
      });
    }

    return {
      name: TELEGRAM,
      mounterInterface: PlatformMounterI,
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
