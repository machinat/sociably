import type { MachinatPlatform } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import { RequestRoute } from '@machinat/http/types';

import { ConfigsI, PlatformUtilitiesI } from './interface';
import { LINE } from './constant';
import { ReceiverP } from './receiver';
import { BotP } from './bot';
import { ProfilerP, LineUserProfile, LineGroupProfile } from './profiler';
import LineChat from './channel';
import LineUser from './user';
import type {
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineResult,
} from './types';

/** @internal */
const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP] as const,
})(
  (configs, receiver): RequestRoute => ({
    name: LINE,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Line {
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
    LineEventContext,
    null,
    LineJob,
    LineDispatchFrame,
    LineResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: LINE,
      },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: LINE,
      },

      { provide: ConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeList, withValue: LineChat },
      { provide: BaseMarshaler.TypeList, withValue: LineUser },
      { provide: BaseMarshaler.TypeList, withValue: LineUserProfile },
      { provide: BaseMarshaler.TypeList, withValue: LineGroupProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.RequestRouteList,
        withProvider: webhookRouteFactory,
      });
    }

    return {
      name: LINE,
      utilitiesInterface: PlatformUtilitiesI,
      provisions,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: makeContainer({ deps: [BotP] as const })((bot: BotP) =>
        bot.start()
      ),
      stopHook: makeContainer({ deps: [BotP] as const })((bot: BotP) =>
        bot.stop()
      ),
    };
  };
}

export default Line;
