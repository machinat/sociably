// @flow
import { container, factory } from '@machinat/core/service';
import type { PlatformModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';
import MessengerBot from './bot';
import {
  MESSENGER_PLATFORM_CONFIGS_I,
  MESSENGER_PLATFORM_MOUNTER_I,
} from './interface';
import { MESSENGER } from './constant';
import MessengerReceiver from './receiver';
import MessengerProfileFetcher from './profile';
import type {
  MessengerPlatformConfigs,
  MessengerEventContext,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult,
} from './types';

export * from './components';
export { default as MessengerChannel } from './channel';
export { default as MessengerUser } from './user';

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
  ProfileFetcher: MessengerProfileFetcher,
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
      {
        provide: Base.BotI,
        withProvider: MessengerBot,
        platforms: [MESSENGER],
      },

      MessengerProfileFetcher,
      {
        provide: Base.ProfileFetcherI,
        withProvider: MessengerProfileFetcher,
        platforms: [MESSENGER],
      },

      MessengerReceiver,
      { provide: MESSENGER_PLATFORM_CONFIGS_I, withValue: configs },
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: requestRoutingFactory },
    ],
    eventMiddlewares: configs.eventMiddlewares,
    dispatchMiddlewares: configs.dispatchMiddlewares,
    startHook: container({ deps: [MessengerBot] })(async (bot: MessengerBot) =>
      bot.start()
    ),
  }),
};

export default Messenger;
