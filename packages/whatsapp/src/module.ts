import type { SociablyPlatform } from '@sociably/core';
import { makeContainer, makeFactoryProvider } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import type { RequestRoute } from '@sociably/http';
import type { MetaApiJob, MetaApiResult } from '@sociably/meta-api';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { WHATSAPP } from './constant';
import BotP from './Bot';
import ReceiverP from './Receiver';
import ProfilerP from './Profiler';
import WhatsAppChat from './Chat';
import WhatsAppUser from './User';
import WhatsAppUserProfile from './UserProfile';
import type {
  WhatsAppConfigs,
  WhatsAppEventContext,
  WhatsAppDispatchFrame,
} from './types';

/** @interanl */
const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: WHATSAPP,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace WhatsApp {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (
    configs: WhatsAppConfigs
  ): SociablyPlatform<
    WhatsAppEventContext,
    null,
    MetaApiJob,
    WhatsAppDispatchFrame,
    MetaApiResult
  > => {
    return {
      name: WHATSAPP,
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
          platform: WHATSAPP,
        },

        ReceiverP,
        { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

        ProfilerP,
        {
          provide: BaseProfiler.PlatformMap,
          withProvider: ProfilerP,
          platform: WHATSAPP,
        },

        { provide: ConfigsI, withValue: configs },
        { provide: BaseMarshaler.TypeList, withValue: WhatsAppChat },
        { provide: BaseMarshaler.TypeList, withValue: WhatsAppUser },
        { provide: BaseMarshaler.TypeList, withValue: WhatsAppUserProfile },
      ],
    };
  };
}

export default WhatsApp;
