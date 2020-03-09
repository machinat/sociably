// @flow
import { inject } from '@machinat/core/service';
import type { PlatformModule } from '@machinat/core/types';
import HTTP from '@machinat/http';
import MessengerBot from './bot';
import {
  MESSENGER,
  MESSENGER_PLATFORM_CONFIGS_I,
  MESSENGER_PLATFORM_MOUNTER_I,
} from './constant';
import MessengerReceiver from './receiver';
import type {
  MessengerPlatformConfigs,
  MessengerEventContext,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult,
} from './types';

const initModule = (
  configs: MessengerPlatformConfigs
): PlatformModule<
  MessengerEventContext,
  null,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult
> => ({
  name: MESSENGER,
  mounterInterface: MESSENGER_PLATFORM_MOUNTER_I,
  provisions: [
    MessengerBot,
    MessengerReceiver,
    { provide: MESSENGER_PLATFORM_CONFIGS_I, withValue: configs },
  ],
  eventMiddlewares: configs.eventMiddlewares,
  dispatchMiddlewares: configs.dispatchMiddlewares,
  startHook: inject({
    deps: [MessengerBot, MessengerReceiver, HTTP.Connector],
  })(
    async (
      bot: MessengerBot,
      receiver: MessengerReceiver,
      connector: HTTP.Connector
    ) => {
      bot.start();
      connector.addRequestRoute(
        configs.webhookPath,
        receiver.handleRequestCallback()
      );
    }
  ),
});

export default initModule;
