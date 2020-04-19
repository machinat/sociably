// @flow
import { inject, factory } from '@machinat/core/service';
import type { PlatformModule } from '@machinat/core/types';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';
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

export * from './component';

const requestRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [MESSENGER_PLATFORM_CONFIGS_I, MessengerReceiver],
})((configs: MessengerPlatformConfigs, receiver: MessengerReceiver) => {
  return {
    name: MESSENGER,
    path: configs.webhookPath || '/',
    handler: receiver.handleRequestCallback(),
  };
});

const Messenger = {
  Bot: MessengerBot,
  Receiver: MessengerReceiver,
  CONFIGS_I: MESSENGER_PLATFORM_CONFIGS_I,

  initModule: (
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
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: requestRoutingFactory },
    ],
    eventMiddlewares: configs.eventMiddlewares,
    dispatchMiddlewares: configs.dispatchMiddlewares,
    startHook: inject({ deps: [MessengerBot] })(async (bot: MessengerBot) =>
      bot.start()
    ),
  }),
};

export default Messenger;
