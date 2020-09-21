import type { PlatformModule, AppProvision } from '@machinat/core/types';
import { container, factory } from '@machinat/core/service';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { TELEGRAM } from './constant';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import { UserProfilerP } from './profiler';
import type {
  TelegramPlatformConfigs,
  TelegramEventContext,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramAPIResult,
} from './types';

/** @interanl */
const requestRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP],
})((configs: TelegramPlatformConfigs, receiver: ReceiverP) => {
  return {
    name: TELEGRAM,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  };
});

const Telegram = {
  Bot: BotP,
  Receiver: ReceiverP,
  UserProfiler: UserProfilerP,
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
    const provisions: AppProvision<any>[] = [
      BotP,
      { provide: Base.BotI, withProvider: BotP, platforms: [TELEGRAM] },

      UserProfilerP,
      {
        provide: Base.UserProfilerI,
        withProvider: UserProfilerP,
        platforms: [TELEGRAM],
      },

      { provide: PLATFORM_CONFIGS_I, withValue: configs },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: HTTP.REQUEST_ROUTINGS_I,
        withProvider: requestRoutingFactory,
      });
    }

    return {
      name: TELEGRAM,
      mounterInterface: PLATFORM_MOUNTER_I,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: container<Promise<void>>({
        deps: [BotP],
      })(async (bot: BotP) => bot.start()),
    };
  },
};

declare namespace Telegram {
  export type Bot = BotP;
  export type Receiver = ReceiverP;
  export type UserProfiler = UserProfilerP;
}

export default Telegram;
