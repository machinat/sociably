// @flow
import { container, factory } from '@machinat/core/service';
import type { PlatformModule } from '@machinat/core/types';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';
import {
  LINE,
  LINE_PLATFORM_CONFIGS_I,
  LINE_PLATFORM_MOUNTER_I,
} from './constant';
import LineReceiver from './receiver';
import LineBot from './bot';
import type {
  LinePlatformConfigs,
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineAPIResult,
} from './types';

export * from './component';

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
  CONFIGS_I: LINE_PLATFORM_CONFIGS_I,

  initModule: (
    configs: LinePlatformConfigs
  ): PlatformModule<
    LineEventContext,
    null,
    LineJob,
    LineDispatchFrame,
    LineAPIResult
  > => ({
    name: LINE,
    mounterInterface: LINE_PLATFORM_MOUNTER_I,
    provisions: [
      LineBot,
      LineReceiver,
      { provide: LINE_PLATFORM_CONFIGS_I, withValue: configs },
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: requestRoutingFactory },
    ],
    eventMiddlewares: configs.eventMiddlewares,
    dispatchMiddlewares: configs.dispatchMiddlewares,
    startHook: container({ deps: [LineBot] })((bot: LineBot) => bot.start()),
  }),
};

export default Line;
