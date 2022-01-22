import type { MachinatPlatform } from '@machinat/core';
import {
  makeContainer,
  makeFactoryProvider,
  ServiceProvision,
} from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http, { RequestRoute } from '@machinat/http';

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

      startHook: makeContainer({ deps: [BotP] })((bot) => bot.start()),
      stopHook: makeContainer({ deps: [BotP] })((bot) => bot.stop()),
    };
  };
}

export default Line;
