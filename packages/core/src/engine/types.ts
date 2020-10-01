import type { TextSegment, UnitSegment, RawSegment } from '../renderer/types';
import type {
  MachinatNode,
  MachinatChannel,
  MachinatBot,
  PauseUntilFn,
  ThunkEffectFn,
} from '../types';
import type MachinatQueue from '../queue';

export type DispatchableSegment<SegmentValue> =
  | TextSegment
  | RawSegment<SegmentValue>
  | UnitSegment<SegmentValue>;

type DispatchTask<Job> = { type: 'dispatch'; payload: Job[] };
type PauseTask = { type: 'pause'; payload: null | PauseUntilFn };
type ThunkTask = { type: 'thunk'; payload: ThunkEffectFn };

export type MachinatTask<Job> = DispatchTask<Job> | PauseTask | ThunkTask;

export type DispatchFrame<
  Channel extends MachinatChannel,
  Job,
  Bot extends MachinatBot<Channel, any, any>
> = {
  platform: string;
  channel: null | Channel;
  tasks: MachinatTask<Job>[];
  bot: Bot;
  node: MachinatNode;
};

export type DispatchResponse<Job, Result> = {
  tasks: MachinatTask<Job>[];
  jobs: Job[];
  results: Result[];
};

export interface MachinatWorker<Job, Result> {
  start(queue: MachinatQueue<Job, Result>): boolean;
  stop(queue: MachinatQueue<Job, Result>): boolean;
}
