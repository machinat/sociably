import type { MachinatPlatform } from '@machinat/core';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http';

import { ConfigsI, PlatformUtilitiesI } from './interface';
import { MESSENGER } from './constant';
import BotP from './Bot';
import ReceiverP from './Receiver';
import MessengerUserProfile from './UserProfile';
import ProfilerP from './Profiler';
import MessengerChat from './Chat';
import SendTarget from './SendTarget';
import MessengerUser from './User';
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
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: MESSENGER,
    path: configs.webhookPath || '/',
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
    return {
      name: MESSENGER,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: makeContainer({ deps: [BotP] })(async (bot) => bot.start()),
      stopHook: makeContainer({ deps: [BotP] })(async (bot) => bot.stop()),

      provisions: [
        BotP,
        {
          provide: BaseBot.PlatformMap,
          withProvider: BotP,
          platform: MESSENGER,
        },

        ReceiverP,
        { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

        ProfilerP,
        {
          provide: BaseProfiler.PlatformMap,
          withProvider: ProfilerP,
          platform: MESSENGER,
        },

        { provide: ConfigsI, withValue: configs },
        { provide: BaseMarshaler.TypeList, withValue: MessengerChat },
        { provide: BaseMarshaler.TypeList, withValue: SendTarget },
        { provide: BaseMarshaler.TypeList, withValue: MessengerUser },
        { provide: BaseMarshaler.TypeList, withValue: MessengerUserProfile },
      ],
    };
  };
}

export default Messenger;
