import type { SociablyPlatform } from '@sociably/core';
import {
  serviceContainer,
  serviceProviderFactory,
  ServiceProvision,
} from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http, { RequestRoute } from '@sociably/http';

import {
  ConfigsI,
  PlatformUtilitiesI,
  ChannelSettingsAccessorI,
} from './interface';
import { LINE } from './constant';
import ReceiverP from './Receiver';
import BotP from './Bot';
import LineUserProfile from './UserProfile';
import LineGroupProfile from './GroupProfile';
import ProfilerP from './Profiler';
import LineChannel from './Channel';
import LineChat from './Chat';
import LineUser from './User';
import {
  createSingleStaticChannelSettingsAccessor,
  createMultiStaticNumberSettingsAccessor,
} from './utils/staticChannelSettingsAccessor';
import type {
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineResult,
} from './types';

const webhookRouteFactory = serviceProviderFactory({
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

  export const ChannelSettingsAccessor = ChannelSettingsAccessorI;
  export type ChannelSettingsAccessor = ChannelSettingsAccessorI;

  export const initModule = (
    configs: ConfigsI
  ): SociablyPlatform<
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

      ReceiverP,
      { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: LINE,
      },

      { provide: ConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeList, withValue: LineChannel },
      { provide: BaseMarshaler.TypeList, withValue: LineChat },
      { provide: BaseMarshaler.TypeList, withValue: LineUser },
      { provide: BaseMarshaler.TypeList, withValue: LineUserProfile },
      { provide: BaseMarshaler.TypeList, withValue: LineGroupProfile },
    ];

    if (configs.channelSettingsService) {
      provisions.push({
        provide: ChannelSettingsAccessorI,
        withProvider: serviceProviderFactory({
          deps: [configs.channelSettingsService],
        })((accessor) => accessor),
      });
    } else if (configs.channelSettings) {
      provisions.push({
        provide: ChannelSettingsAccessorI,
        withValue: createSingleStaticChannelSettingsAccessor(
          configs.channelSettings
        ),
      });
    } else if (configs.multiChannelSettings) {
      if (configs.multiChannelSettings.length === 0) {
        throw new Error('configs.multiChannelSettings must not be empty');
      }

      provisions.push({
        provide: ChannelSettingsAccessorI,
        withValue: createMultiStaticNumberSettingsAccessor([
          ...configs.multiChannelSettings,
        ]),
      });
    } else {
      throw new Error(
        'Line platform requires one of `channelSettings`, `multiChannelSettings` or `channelSettingsService` option'
      );
    }

    return {
      name: LINE,
      provisions,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: serviceContainer({ deps: [BotP] })((bot) => bot.start()),
      stopHook: serviceContainer({ deps: [BotP] })((bot) => bot.stop()),
    };
  };
}

export default Line;
