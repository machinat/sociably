import { BotP } from './Bot';
import { ProfilerP } from './Profiler';
import { MarshalerP } from './Marshaler';
import { StateControllerI, BaseStateController } from './StateControllerI';
import { IntentRecognizerI, BaseIntentRecognizer } from './IntentRecognizerI';

export { BotP as BaseBot } from './Bot';
export { ProfilerP as BaseProfiler } from './Profiler';
export { MarshalerP as BaseMarshaler } from './Marshaler';
export { StateControllerI as BaseStateControllerI } from './StateControllerI';
export { IntentRecognizerI as BaseIntentRecognizerI } from './IntentRecognizerI';

const Base = {
  Bot: BotP,
  Profiler: ProfilerP,
  Marshaler: MarshalerP,
  StateControllerI,
  IntentRecognizerI,
};

declare namespace Base {
  export type Bot = BotP;
  export type Profiler = ProfilerP;
  export type Marshaler = MarshalerP;
  export type StateControllerI = BaseStateController;
  export type IntentRecognizerI<P> = BaseIntentRecognizer<P>;
}

export default Base;
