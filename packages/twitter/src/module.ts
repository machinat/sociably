import type { MachinatPlatform } from '@machinat/core';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http';

import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TWITTER } from './constant';
import BotP from './Bot';
import ReceiverP from './Receiver';
import ProfilerP from './Profiler';
import TwitterUserProfile from './UserProfile';
import TwitterChat from './Chat';
import TweetTarget from './TweetTarget';
import TwitterUser from './User';
import type {
  TwitterEventContext,
  TwitterJob,
  TwitterDispatchFrame,
  TwitterApiResult,
} from './types';

/** @interanl */
const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: TWITTER,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Twitter {
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
    TwitterEventContext,
    null,
    TwitterJob,
    TwitterDispatchFrame,
    TwitterApiResult
  > => {
    return {
      name: TWITTER,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: makeContainer({ deps: [BotP] })((bot: BotP) => bot.start()),
      stopHook: makeContainer({ deps: [BotP] })((bot: BotP) => bot.stop()),

      provisions: [
        { provide: ConfigsI, withValue: configs },
        BotP,
        {
          provide: BaseBot.PlatformMap,
          withProvider: BotP,
          platform: TWITTER,
        },

        ReceiverP,
        { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

        ProfilerP,
        {
          provide: BaseProfiler.PlatformMap,
          withProvider: ProfilerP,
          platform: TWITTER,
        },

        { provide: BaseMarshaler.TypeList, withValue: TwitterChat },
        { provide: BaseMarshaler.TypeList, withValue: TweetTarget },

        { provide: BaseMarshaler.TypeList, withValue: TwitterUser },
        { provide: BaseMarshaler.TypeList, withValue: TwitterUserProfile },
      ],
    };
  };
}

export default Twitter;
