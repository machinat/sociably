import BotI from './BotI';
import UserProfilerI from './UserProfilerI';
import StateControllerI from './StateControllerI';
import IntentRecognizerI from './IntentRecognizerI';

const Base = {
  BotI,
  UserProfilerI,
  StateControllerI,
  IntentRecognizerI,
};

declare namespace Base {
  export type BotI = InstanceType<typeof BotI>;
  export type UserProfilerI = InstanceType<typeof UserProfilerI>;
  export type StateControllerI = InstanceType<typeof StateControllerI>;
  export type IntentRecognizerI = InstanceType<typeof IntentRecognizerI>;
}

export default Base;
export { BotI, UserProfilerI, StateControllerI, IntentRecognizerI };
