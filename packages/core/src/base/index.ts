import { BotP } from './Bot';
import { ProfilerP } from './Profiler';
import { MarshalerP } from './Marshaler';
import { StateControllerI, BaseStateController } from './StateControllerI';
import { IntentRecognizerI, BaseIntentRecognizer } from './IntentRecognizerI';

export { BaseBot } from './Bot';
export { BaseProfiler } from './Profiler';
export { BaseMarshaler } from './Marshaler';

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
