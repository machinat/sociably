import type { TextSegment, UnitSegment, RawSegment } from '../renderer/types';
import type {
  SociablyNode,
  DispatchTarget,
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

export type DispatchFrame<Target extends null | DispatchTarget, Job> = {
  platform: string;
  target: Target;
  tasks: SociablyTask<Job>[];
  node: null | SociablyNode;
};

export type AnyDispatchFrame = DispatchFrame<null | DispatchTarget, unknown>;

export type DispatchResponse<Job, Result> = {
  tasks: SociablyTask<Job>[];
  jobs: Job[];
  results: Result[];
};

export interface SociablyWorker<Job, Result> {
  start(queue: SociablyQueue<Job, Result>): boolean;
  stop(queue: SociablyQueue<Job, Result>): boolean;
}
