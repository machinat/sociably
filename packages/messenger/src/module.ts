import type { PlatformModule } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseProfiler, BaseMarshaler } from '@machinat/core/base';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { MESSENGER } from './constant';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import { ProfilerP, MessengerUserProfile } from './profiler';
import MessengerChat from './channel';
import MessengerUser from './user';
import type {
  MessengerPlatformConfigs,
  MessengerEventContext,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult,
} from './types';

/** @interanl */
const requestRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP] as const,
})(
  (configs, receiver): HTTPRequestRouting => ({
    name: MESSENGER,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Messenger = {
  Bot: BotP,
  Receiver: ReceiverP,
  Profiler: ProfilerP,
  CONFIGS_I: PLATFORM_CONFIGS_I,

  initModule: (
    configs: MessengerPlatformConfigs
  ): PlatformModule<
    MessengerEventContext,
    null,
    MessengerJob,
    MessengerDispatchFrame,
    MessengerResult
  > => {
    const provisions: ServiceProvision<any>[] = [
      BotP,
      {
        provide: BaseBot.PLATFORMS_I,
        withProvider: BotP,
        platform: MESSENGER,
      },

      ProfilerP,
      {
        provide: BaseProfiler.PLATFORMS_I,
        withProvider: ProfilerP,
        platform: MESSENGER,
      },

      { provide: PLATFORM_CONFIGS_I, withValue: configs },
      { provide: BaseMarshaler.TYPINGS_I, withValue: MessengerChat },
      { provide: BaseMarshaler.TYPINGS_I, withValue: MessengerUser },
      { provide: BaseMarshaler.TYPINGS_I, withValue: MessengerUserProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: HTTP.REQUEST_ROUTINGS_I,
        withProvider: requestRoutingFactory,
      });
    }

    return {
      name: MESSENGER,
      mounterInterface: PLATFORM_MOUNTER_I,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: makeContainer({
        deps: [BotP] as const,
      })(async (bot: BotP) => bot.start()),
    };
  },
};

declare namespace Messenger {
  export type Bot = BotP;
  export type Receiver = ReceiverP;
  export type Profiler = ProfilerP;
}

export default Messenger;
