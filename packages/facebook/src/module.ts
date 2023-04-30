import type { SociablyPlatform } from '@sociably/core';
import {
  makeContainer,
  makeFactoryProvider,
  ServiceProvision,
} from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import type { RequestRoute } from '@sociably/http';
import type { MetaApiJob, MetaApiResult } from '@sociably/meta-api';
import {
  ConfigsI,
  PlatformUtilitiesI,
  PageSettingsAccessorI,
} from './interface';
import { FACEBOOK } from './constant';
import BotP from './Bot';
import ReceiverP from './Receiver';
import FacebookUserProfile from './UserProfile';
import ProfilerP from './Profiler';
import FacebookPage from './Page';
import FacebookChat from './Chat';
import FacebookUser from './User';
import createStaticPageSettingsAccessor from './utils/createStaticPageSettingsAccessor';
import type {
  FacebookConfigs,
  FacebookEventContext,
  FacebookDispatchFrame,
} from './types';

/** @interanl */
const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: FACEBOOK,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace Facebook {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Profiler = ProfilerP;
  export type Profiler = ProfilerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const PageSettingsAccessor = PageSettingsAccessorI;
  export type PageSettingsAccessor = PageSettingsAccessorI;

  export const initModule = (
    configs: FacebookConfigs
  ): SociablyPlatform<
    FacebookEventContext,
    null,
    MetaApiJob,
    FacebookDispatchFrame,
    MetaApiResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: FACEBOOK,
      },

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: FACEBOOK,
      },

      { provide: ConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeList, withValue: FacebookChat },
      { provide: BaseMarshaler.TypeList, withValue: FacebookUser },
      { provide: BaseMarshaler.TypeList, withValue: FacebookPage },
      { provide: BaseMarshaler.TypeList, withValue: FacebookUserProfile },
    ];

    if (configs.pageSettingsService) {
      provisions.push({
        provide: PageSettingsAccessorI,
        withProvider: makeFactoryProvider({
          deps: [configs.pageSettingsService],
        })((accessor) => accessor),
      });
    } else if (configs.pageSettings) {
      provisions.push({
        provide: PageSettingsAccessorI,
        withValue: createStaticPageSettingsAccessor([configs.pageSettings]),
      });
    } else if (configs.multiPageSettings) {
      if (configs.multiPageSettings.length === 0) {
        throw new Error(
          'configs.multiPageSettings must have at least one page settings'
        );
      }

      provisions.push({
        provide: PageSettingsAccessorI,
        withValue: createStaticPageSettingsAccessor([
          ...configs.multiPageSettings,
        ]),
      });
    } else {
      throw new Error(
        'Facebook platform requires one of `pageSettings`, `multiPageSettings` or `pageSettingsService` option'
      );
    }

    return {
      name: FACEBOOK,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: makeContainer({ deps: [BotP] })(async (bot) => bot.start()),
      stopHook: makeContainer({ deps: [BotP] })(async (bot) => bot.stop()),
    };
  };
}

export default Facebook;
