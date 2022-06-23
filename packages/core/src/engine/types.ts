import type { TextSegment, UnitSegment, RawSegment } from '../renderer/types';
import type {
  SociablyNode,
  SociablyChannel,
  PauseDelayFn,
  ThunkEffectFn,
} from '../types';
import type SociablyQueue from '../queue';

export type DispatchableSegment<SegmentValue> =
  | TextSegment
  | RawSegment<SegmentValue>
  | UnitSegment<SegmentValue>;

type DispatchTask<Job> = { type: 'dispatch'; payload: Job[] };
type PauseTask = { type: 'pause'; payload: null | PauseDelayFn };
type ThunkTask = { type: 'thunk'; payload: ThunkEffectFn };

export type SociablyTask<Job> = DispatchTask<Job> | PauseTask | ThunkTask;

export type DispatchFrame<Channel extends SociablyChannel, Job> = {
  platform: string;
  channel: null | Channel;
  tasks: SociablyTask<Job>[];
  node: null | SociablyNode;
};

export type DispatchResponse<Job, Result> = {
  tasks: SociablyTask<Job>[];
  jobs: Job[];
  results: Result[];
};

export interface SociablyWorker<Job, Result> {
  start(queue: SociablyQueue<Job, Result>): boolean;
  stop(queue: SociablyQueue<Job, Result>): boolean;
}
