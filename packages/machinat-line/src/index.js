// @flow
import initModule from './module';
import LineBot from './bot';
import LineReceiver from './receiver';
import { LINE_PLATFORM_CONFIGS_I } from './constant';

export * from './component';

const Line = {
  initModule,
  Bot: LineBot,
  Receiver: LineReceiver,
  CONFIGS_I: LINE_PLATFORM_CONFIGS_I,
};

export default Line;
