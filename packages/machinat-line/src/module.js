// @flow
import { inject } from '@machinat/core/service';
import type { PlatformModule } from '@machinat/core/types';
import HTTP from '@machinat/http';
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

const initModule = (
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
  ],
  eventMiddlewares: configs.eventMiddlewares,
  dispatchMiddlewares: configs.dispatchMiddlewares,
  startHook: inject({
    deps: [LineBot, LineReceiver, HTTP.Connector],
  })(
    async (bot: LineBot, receiver: LineReceiver, connector: HTTP.Connector) => {
      bot.start();
      connector.addRequestRoute(
        configs.webhookPath,
        receiver.handleRequestCallback()
      );
    }
  ),
});

export default initModule;
