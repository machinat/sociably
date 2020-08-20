import { MachinatChannel } from '../types';
import BaseBotI, { BaseBot } from './BotI';
import BaseUserProfilerI, { BaseUserProfiler } from './UserProfilerI';
import BaseStateControllerI, { BaseStateController } from './StateControllerI';
import BaseIntentRecognizerI, {
  BaseIntentRecognizer,
} from './IntentRecognizerI';

const Base = {
  BotI: BaseBotI,
  UserProfilerI: BaseUserProfilerI,
  StateControllerI: BaseStateControllerI,
  IntentRecognizerI: BaseIntentRecognizerI,
};

declare namespace Base {
  export type BotI<C extends MachinatChannel, J, R> = BaseBot<C, J, R>;
  export type UserProfilerI = BaseUserProfiler;
  export type StateControllerI = BaseStateController;
  export type IntentRecognizerI<P> = BaseIntentRecognizer<P>;
}

export default Base;

export const BotI = BaseBotI;
export type BotI<C extends MachinatChannel, J, R> = BaseBot<C, J, R>;

export const UserProfilerI = BaseUserProfilerI;
export type UserProfilerI = BaseUserProfiler;

export const IntentRecognizerI = BaseIntentRecognizerI;
export type IntentRecognizerI<P> = BaseIntentRecognizer<P>;

export const StateControllerI = BaseStateControllerI;
export type StateControllerI = BaseStateController;
