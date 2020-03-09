// @flow
import initModule from './module';
import MessengerBot from './bot';
import MessengerReceiver from './receiver';
import { MESSENGER_PLATFORM_CONFIGS_I } from './constant';

export * from './component';

const Messenger = {
  initModule,
  Bot: MessengerBot,
  Receiver: MessengerReceiver,
  CONFIGS: MESSENGER_PLATFORM_CONFIGS_I,
};

export default Messenger;
