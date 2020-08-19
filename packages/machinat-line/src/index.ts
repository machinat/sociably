import type { PlatformModule, AppProvision } from '@machinat/core/types';
import { container, factory } from '@machinat/core/service';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import { HTTPRequestRouting } from '@machinat/http/types';

import { LINE_PLATFORM_CONFIGS_I, LINE_PLATFORM_MOUNTER_I } from './interface';
import { LINE } from './constant';
import ReceiverP, { LineReceiver } from './receiver';
import BotP, { LineBot } from './bot';
import UserProfilerP, { LineUserProfiler } from './profile';
import type {
  LinePlatformConfigs,
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineAPIResult,
} from './types';

export { default as LineChannel } from './channel';
export { default as LineUser } from './user';

const requestRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [LINE_PLATFORM_CONFIGS_I, ReceiverP],
})((configs: LinePlatformConfigs, receiver: LineReceiver) => {
  return {
    name: LINE,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  };
});

const Line = {
  Bot: BotP,
  Receiver: ReceiverP,
  UserProfiler: UserProfilerP,
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
    const provisions: AppProvision<any>[] = [
      BotP,
      { provide: Base.BotI, withProvider: BotP, platforms: [LINE] },

      UserProfilerP,
      {
        provide: Base.UserProfilerI,
        withProvider: UserProfilerP,
        platforms: [LINE],
      },

      { provide: LINE_PLATFORM_CONFIGS_I, withValue: configs },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: HTTP.REQUEST_ROUTINGS_I,
        withProvider: requestRoutingFactory,
      });
    }

    return {
      name: LINE,
      mounterInterface: LINE_PLATFORM_MOUNTER_I,
      provisions,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: container<Promise<void>>({ deps: [BotP] })((bot: LineBot) =>
        bot.start()
      ),
    };
  },
};

declare namespace Line {
  export type Bot = LineBot;
  export type Receiver = LineReceiver;
  export type UserProfiler = LineUserProfiler;
}

export default Line;
