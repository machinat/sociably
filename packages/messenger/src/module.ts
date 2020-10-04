import type { PlatformModule, AppProvision } from '@machinat/core/types';
import { container, factory } from '@machinat/core/service';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { MESSENGER } from './constant';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import { ProfilerP } from './profiler';
import type {
  MessengerPlatformConfigs,
  MessengerEventContext,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult,
} from './types';

/** @interanl */
const requestRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP],
})((configs: MessengerPlatformConfigs, receiver: ReceiverP) => {
  return {
    name: MESSENGER,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  };
});

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
    const provisions: AppProvision<any>[] = [
      BotP,
      { provide: Base.BotI, withProvider: BotP, platforms: [MESSENGER] },

      ProfilerP,
      {
        provide: Base.ProfilerI,
        withProvider: ProfilerP,
        platforms: [MESSENGER],
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
      name: MESSENGER,
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

declare namespace Messenger {
  export type Bot = BotP;
  export type Receiver = ReceiverP;
  export type Profiler = ProfilerP;
}

export default Messenger;