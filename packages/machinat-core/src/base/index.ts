import { MachinatChannel } from '../types';
import { BotI, BaseBot } from './BotI';
import { UserProfilerI, BaseUserProfiler } from './UserProfilerI';
import { StateControllerI, BaseStateController } from './StateControllerI';
import { IntentRecognizerI, BaseIntentRecognizer } from './IntentRecognizerI';

export { BotI as BaseBotI } from './BotI';
export { UserProfilerI as BaseUserProfilerI } from './UserProfilerI';
export { StateControllerI as BaseStateControllerI } from './StateControllerI';
export { IntentRecognizerI as BaseIntentRecognizerI } from './IntentRecognizerI';

const Base = {
  BotI,
  UserProfilerI,
  StateControllerI,
  IntentRecognizerI,
};

declare namespace Base {
  export type BotI<C extends MachinatChannel, J, R> = BaseBot<C, J, R>;
  export type UserProfilerI = BaseUserProfiler;
  export type StateControllerI = BaseStateController;
  export type IntentRecognizerI<P> = BaseIntentRecognizer<P>;
}

export default Base;
