import type { PlatformModule, AppProvision } from '@machinat/core/types';
import { container, factory } from '@machinat/core/service';
import { BaseBotI, BaseUserProfilerI } from '@machinat/core/base';
import HTTP from '@machinat/http';
import { HTTPRequestRouting } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { LINE } from './constant';
import { ReceiverP } from './receiver';
import { BotP } from './bot';
import { UserProfilerP } from './profiler';
import type {
  LinePlatformConfigs,
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineAPIResult,
} from './types';

/** @internal */
const requestRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP],
})((configs: LinePlatformConfigs, receiver: ReceiverP) => {
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
  CONFIGS_I: PLATFORM_CONFIGS_I,

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
      { provide: BaseBotI, withProvider: BotP, platforms: [LINE] },

      UserProfilerP,
      {
        provide: BaseUserProfilerI,
        withProvider: UserProfilerP,
        platforms: [LINE],
      },

      { provide: PLATFORM_CONFIGS_I, withValue: configs },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: HTTP.REQUEST_ROUTINGS_I,
        withProvider: requestRoutingFactory,
      });
    }

    return {
      name: LINE,
      mounterInterface: PLATFORM_MOUNTER_I,
      provisions,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: container<Promise<void>>({ deps: [BotP] })((bot: BotP) =>
        bot.start()
      ),
    };
  },
};

declare namespace Line {
  export type Bot = BotP;
  export type Receiver = ReceiverP;
  export type UserProfiler = UserProfilerP;
}

export default Line;