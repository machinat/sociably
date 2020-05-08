// @flow
import invariant from 'invariant';
import { container, factory } from '@machinat/core/service';
import type { PlatformModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';
import { LINE_PLATFORM_CONFIGS_I, LINE_PLATFORM_MOUNTER_I } from './interface';
import { LINE } from './constant';
import LineReceiver from './receiver';
import LineBot from './bot';
import LineProfileFetcher from './profile';
import type {
  LinePlatformConfigs,
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineAPIResult,
} from './types';

export * from './components';

const requestRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [LINE_PLATFORM_CONFIGS_I, LineReceiver],
})((configs: LinePlatformConfigs, receiver: LineReceiver) => {
  return {
    name: LINE,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  };
});

const Line = {
  Bot: LineBot,
  Receiver: LineReceiver,
  ProfileFetcher: LineProfileFetcher,
  CONFIGS_I: LINE_PLATFORM_CONFIGS_I,

  initModule: (
    configs: LinePlatformConfigs
  ): PlatformModule<
    LineEventContext,
    null,
    LineJob,
    LineDispatchFrame,
    LineAPIResult
  > => {
    invariant(configs.providerId, 'configs.providerId should not be empty');
    invariant(configs.botChannelId, 'configs.botChannelId should not be empty');

    return {
      name: LINE,
      mounterInterface: LINE_PLATFORM_MOUNTER_I,
      provisions: [
        LineBot,
        { provide: Base.BotI, withProvider: LineBot, platforms: [LINE] },

        LineProfileFetcher,
        {
          provide: Base.ProfileFetcherI,
          withProvider: LineProfileFetcher,
          platforms: [LINE],
        },

        LineReceiver,
        { provide: LINE_PLATFORM_CONFIGS_I, withValue: configs },
        {
          provide: HTTP.REQUEST_ROUTINGS_I,
          withProvider: requestRoutingFactory,
        },
      ],
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      startHook: container({ deps: [LineBot] })((bot: LineBot) => bot.start()),
    };
  },
};

export default Line;
