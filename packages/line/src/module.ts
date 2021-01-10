import type { PlatformModule } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseProfiler, BaseMarshaler } from '@machinat/core/base';
import Http from '@machinat/http';
import { HttpRequestRouting } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { LINE } from './constant';
import { ReceiverP } from './receiver';
import { BotP } from './bot';
import { ProfilerP, LineUserProfile, LineGroupProfile } from './profiler';
import LineChat from './channel';
import LineUser from './user';
import type {
  LinePlatformConfigs,
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineAPIResult,
} from './types';

/** @internal */
const requestRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP] as const,
})(
  (configs, receiver): HttpRequestRouting => ({
    name: LINE,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Line = {
  Bot: BotP,
  Receiver: ReceiverP,
  Profiler: ProfilerP,
  CONFIGS_I: PLATFORM_CONFIGS_I,

  initModule: (
    configs: LinePlatformConfigs
  ): PlatformModule<
    LineEventContext,
    null,
    LineJob,
    LineDispatchFrame,
    LineAPIResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      BotP,
      {
        provide: BaseBot.PLATFORMS_I,
        withProvider: BotP,
        platform: LINE,
      },

      ProfilerP,
      {
        provide: BaseProfiler.PLATFORMS_I,
        withProvider: ProfilerP,
        platform: LINE,
      },

      { provide: PLATFORM_CONFIGS_I, withValue: configs },
      { provide: BaseMarshaler.TYPINGS_I, withValue: LineChat },
      { provide: BaseMarshaler.TYPINGS_I, withValue: LineUser },
      { provide: BaseMarshaler.TYPINGS_I, withValue: LineUserProfile },
      { provide: BaseMarshaler.TYPINGS_I, withValue: LineGroupProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.REQUEST_ROUTINGS_I,
        withProvider: requestRoutingFactory,
      });
    }

    return {
      name: LINE,
      mounterInterface: PLATFORM_MOUNTER_I,
      provisions,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: makeContainer({
        deps: [BotP] as const,
      })((bot: BotP) => bot.start()),
    };
  },
};

declare namespace Line {
  export type Bot = BotP;
  export type Receiver = ReceiverP;
  export type Profiler = ProfilerP;
}

export default Line;
