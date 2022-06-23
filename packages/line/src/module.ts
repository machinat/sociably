import type { SociablyPlatform } from '@sociably/core';
import { makeContainer, makeFactoryProvider } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http, { RequestRoute } from '@sociably/http';

import { ConfigsI, PlatformUtilitiesI } from './interface';
import { LINE } from './constant';
import ReceiverP from './Receiver';
import BotP from './Bot';
import LineUserProfile from './UserProfile';
import LineGroupProfile from './GroupProfile';
import ProfilerP from './Profiler';
import LineChat from './Chat';
import LineUser from './User';
import type {
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineResult,
} from './types';

const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: LINE,
    path: configs.webhookPath || '/',
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
  ): SociablyPlatform<
    LineEventContext,
    null,
    LineJob,
    LineDispatchFrame,
    LineResult
  > => {
    return {
      name: LINE,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: makeContainer({ deps: [BotP] })((bot) => bot.start()),
      stopHook: makeContainer({ deps: [BotP] })((bot) => bot.stop()),

      provisions: [
        BotP,
        {
          provide: BaseBot.PlatformMap,
          withProvider: BotP,
          platform: LINE,
        },

        ReceiverP,
        { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

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
      ],
    };
  };
}

export default Line;
