import { MachinatChannel } from '../types';
import { BotI, BaseBot } from './BotI';
import { ProfilerI, BaseProfiler } from './ProfilerI';
import { StateControllerI, BaseStateController } from './StateControllerI';
import { IntentRecognizerI, BaseIntentRecognizer } from './IntentRecognizerI';

export { BotI as BaseBotI } from './BotI';
export { ProfilerI as BaseProfilerI } from './ProfilerI';
export { StateControllerI as BaseStateControllerI } from './StateControllerI';
export { IntentRecognizerI as BaseIntentRecognizerI } from './IntentRecognizerI';

const Base = {
  BotI,
  ProfilerI,
  StateControllerI,
  IntentRecognizerI,
};

declare namespace Base {
  export type BotI<C extends MachinatChannel, J, R> = BaseBot<C, J, R>;
  export type ProfilerI = BaseProfiler;
  export type StateControllerI = BaseStateController;
  export type IntentRecognizerI<P> = BaseIntentRecognizer<P>;
}

export default Base;
