import type { PlatformModule } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseProfiler, BaseMarshaler } from '@machinat/core/base';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';

import { ConfigsI as MessengerConfigsI, PlatformMounterI } from './interface';
import { MESSENGER } from './constant';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import { ProfilerP, MessengerUserProfile } from './profiler';
import MessengerChat from './channel';
import MessengerUser from './user';
import type {
  MessengerConfigs,
  MessengerEventContext,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult,
} from './types';

/** @interanl */
const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [MessengerConfigsI, ReceiverP] as const,
})(
  (configs, receiver): RequestRoute => ({
    name: MESSENGER,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Messenger = {
  Bot: BotP,
  Receiver: ReceiverP,
  Profiler: ProfilerP,
  ConfigsI: MessengerConfigsI,

  initModule: (
    configs: MessengerConfigs
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
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: MESSENGER,
      },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: MESSENGER,
      },

      { provide: MessengerConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeI, withValue: MessengerChat },
      { provide: BaseMarshaler.TypeI, withValue: MessengerUser },
      { provide: BaseMarshaler.TypeI, withValue: MessengerUserProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.RequestRouteList,
        withProvider: webhookRouteFactory,
      });
    }

    return {
      name: MESSENGER,
      mounterInterface: PlatformMounterI,
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
  export type ConfigsI = MessengerConfigsI;
}

export default Messenger;
