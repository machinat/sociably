import type { MachinatPlatform } from '@machinat/core';
import {
  makeContainer,
  makeFactoryProvider,
  ServiceProvision,
} from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http';

import { ConfigsI, PlatformUtilitiesI } from './interface';
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
  deps: [ConfigsI, ReceiverP] as const,
})(
  (configs, receiver): RequestRoute => ({
    name: MESSENGER,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Messenger {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (
    configs: MessengerConfigs
  ): MachinatPlatform<
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

      { provide: ConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeList, withValue: MessengerChat },
      { provide: BaseMarshaler.TypeList, withValue: MessengerUser },
      { provide: BaseMarshaler.TypeList, withValue: MessengerUserProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.RequestRouteList,
        withProvider: webhookRouteFactory,
      });
    }

    return {
      name: MESSENGER,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: makeContainer({ deps: [BotP] as const })(async (bot: BotP) =>
        bot.start()
      ),
      stopHook: makeContainer({ deps: [BotP] as const })(async (bot: BotP) =>
        bot.stop()
      ),
    };
  };
}

export default Messenger;
