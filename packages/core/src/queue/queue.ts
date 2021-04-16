/* eslint-disable no-param-reassign */
import Denque from 'denque';
import type { JobBatchResponse, JobResponse } from './types';

type BatchResolveCallback<Job, Result> = (
  batch: JobBatchResponse<Job, Result>
) => void;

type BatchRequest<Job, Result> = {
  begin: number;
  end: number;
  resolve: BatchResolveCallback<Job, Result>;
  finishedCount: number;
  acquiredCount: number;
  success: boolean;
  errors: Error[] | null;
  responses: null | (void | JobResponse<Job, Result>)[];
};

type JobBox<Job> = {
  seq: number;
  job: Job;
  request: BatchRequest<Job, any>;
};

type ConsumeJobsFn<Job, Result> = (
  job: Job[]
) => Promise<JobResponse<Job, Result>[]>;

const reduceRequestsOfBoxes = <Job, Result, Acc>(
  boxes: JobBox<Job>[],
  reducer: (
    reduced: Acc,
    request: BatchRequest<Job, Result>,
    boxes: JobBox<Job>[],
    begin: number,
    count: number
  ) => Acc,
  initial: Acc
): Acc => {
  let jobBegin = 0;
  let lastRequest = boxes[0].request;
  let reduced = initial;

  for (let i = 1; i <= boxes.length; i += 1) {
    const pkg = boxes[i];
    const isLoopEnded = i === boxes.length;

    if (isLoopEnded || lastRequest !== pkg.request) {
      reduced = reducer(reduced, lastRequest, boxes, jobBegin, i - jobBegin);

      if (!isLoopEnded) {
        lastRequest = pkg.request;
        jobBegin = i;
      }
    }
  }

  return reduced;
};

const addAcquireCountReducer = <Job, Result>(
  _: void,
  request: BatchRequest<Job, Result>
) => {
  request.acquiredCount += 1;
};

const addAcquireCountOfJobs = <Job>(boxes: JobBox<Job>[]) => {
  reduceRequestsOfBoxes(boxes, addAcquireCountReducer, undefined as void);
};

export default class MachinatQueue<Job, Result> {
  currentSeq: number;

  private _queuedJobs: Denque<JobBox<Job>>;
  private _waitingRequets: Set<BatchRequest<Job, Result>>;
  private _jobListeners: ((queue: MachinatQueue<Job, Result>) => void)[];

  private _finishJobsReducerCallback: (
    jobResps: JobResponse<Job, Result>[],
    request: BatchRequest<Job, Result>,
    boxes: JobBox<Job>[],
    begin: number,
    count: number
  ) => JobResponse<Job, Result>[];

  private _failJobsReducerCallback: (
    reason: Error,
    request: BatchRequest<Job, Result>,
    boxes: JobBox<Job>[],
    begin: number,
    count: number
  ) => Error;

  constructor() {
    this.currentSeq = 0;
    this._queuedJobs = new Denque();
    this._waitingRequets = new Set();
    this._jobListeners = [];

    this._finishJobsReducerCallback = this._finishJobsReducer.bind(this);
    this._failJobsReducerCallback = this._failJobsReducer.bind(this);
  }

  onJobs(listener: (queue: MachinatQueue<Job, Result>) => void): void {
    this._jobListeners.push(listener);
  }

  removeJobsListener(
    listenerToRemove: (queue: MachinatQueue<Job, Result>) => void
  ): boolean {
    const listeners = this._jobListeners;
    for (let i = 0; i < listeners.length; i += 1) {
      if (listeners[i] === listenerToRemove) {
        this._jobListeners.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  private _emitJobEvent(): void {
    const listeners = this._jobListeners;
    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i](this);
    }
  }

  peekAt(idx: number): void | Job {
    const pkg = this._queuedJobs.peekAt(idx);
    return pkg ? pkg.job : undefined;
  }

  async acquireAt(
    idx: number,
    count: number,
    consume: ConsumeJobsFn<Job, Result>
  ): Promise<void | JobResponse<Job, Result>[]> {
    const boxes = this._queuedJobs.remove(idx, count);
    if (boxes === undefined) {
      return undefined;
    }

    addAcquireCountOfJobs(boxes);

    try {
      const jobs = boxes.map((box) => box.job);
      const jobsResult = await consume(jobs);

      this._finishJobs(boxes, jobsResult);
      return jobsResult;
    } catch (err) {
      this._failJobs(boxes, err);
      throw err;
    }
  }

  acquire(
    count: number,
    consume: (jobs: Job[]) => Promise<JobResponse<Job, Result>[]>
  ): Promise<void | JobResponse<Job, Result>[]> {
    return this.acquireAt(0, count, consume);
  }

  private _enqueueJobs(jobs: Job[], request: BatchRequest<Job, Result>): void {
    const seq = this.currentSeq;

    for (let i = 0; i < jobs.length; i += 1) {
      this._queuedJobs.push({ seq: seq + i, job: jobs[i], request });
    }

    this.currentSeq = seq + jobs.length;
    this._emitJobEvent();
  }

  executeJobs(jobs: Job[]): Promise<JobBatchResponse<Job, Result>> {
    if (jobs.length === 0) {
      return Promise.resolve({ success: true, errors: null, batch: [] });
    }

    return new Promise((resolve: BatchResolveCallback<Job, Result>) => {
      const seq = this.currentSeq;

      const request = {
        begin: seq,
        end: seq + jobs.length,
        resolve,
        acquiredCount: 0,
        finishedCount: 0,
        success: true,
        errors: null,
        responses: null,
      };

      this._enqueueJobs(jobs, request);
      this._waitingRequets.add(request);
    });
  }

  get length(): number {
    return this._queuedJobs.length;
  }

  private _finishJobs(
    boxes: JobBox<Job>[],
    jobResps: JobResponse<Job, Result>[]
  ) {
    reduceRequestsOfBoxes(boxes, this._finishJobsReducerCallback, jobResps);
  }

  private _finishJobsReducer(
    jobResps: JobResponse<Job, Result>[],
    request: BatchRequest<Job, Result>,
    boxes: JobBox<Job>[],
    begin: number,
    count: number
  ) {
    const { begin: requestBegin, end: requestEnd } = request;

    if (!request.responses) {
      request.responses = new Array(requestEnd - requestBegin);
    }

    let success = true;
    const end = begin + count;

    for (let i = begin; i < end; i += 1) {
      const { seq } = boxes[i];

      const jobResponse = jobResps[i];
      request.responses[seq - requestBegin] = jobResponse;

      request.finishedCount += 1;
      if (!jobResponse.success) {
        success = false;

        if (!request.errors) {
          request.errors = [];
        }
        request.errors.push(jobResponse.error);
      }
    }

    if (!success) {
      this._removeJobsOfRequest(request);
    }

    request.success = request.success && success;

    const jobLength = requestEnd - requestBegin;
    if (
      request.acquiredCount <= 1 &&
      (request.finishedCount === jobLength || !success)
    ) {
      // NOTE: either SuccessJobResponse or FailedJobResponse should be fulfilled here
      request.resolve({
        success: request.success,
        errors: request.errors,
        batch: request.responses,
      } as JobBatchResponse<Job, Result>);

      this._waitingRequets.delete(request);
    } else {
      request.acquiredCount -= 1;
    }

    return jobResps;
  }

  private _failJobs(boxes: JobBox<Job>[], reason: Error) {
    reduceRequestsOfBoxes(boxes, this._failJobsReducerCallback, reason);
  }

  private _failJobsReducer(
    reason: Error,
    request: BatchRequest<Job, Result>,
    boxes: JobBox<Job>[],
    begin: number,
    count: number
  ) {
    this._removeJobsOfRequest(request);

    request.success = false;

    if (!request.errors) {
      request.errors = [];
    }
    request.errors.push(reason);

    if (request.acquiredCount <= 1) {
      request.resolve({
        success: false,
        errors: request.errors,
        batch: request.responses,
      });

      this._waitingRequets.delete(request);
    } else {
      request.acquiredCount -= 1;
      request.finishedCount += count;
    }

    return reason;
  }

  private _removeJobsOfRequest(requestToClear: BatchRequest<Job, Result>) {
    const jobLength = this._queuedJobs.length;
    let removeBegin = -1;

    for (let i = 0; i < jobLength; i += 1) {
      const { request } = this._queuedJobs.peekAt(i) as JobBox<Job>;

      if (request === requestToClear) {
        if (removeBegin === -1) {
          removeBegin = i;
        }
      } else if (removeBegin !== -1) {
        this._queuedJobs.remove(removeBegin, i - removeBegin);
        return;
      }
    }

    if (removeBegin !== -1) {
      this._queuedJobs.remove(removeBegin, jobLength - removeBegin);
    }
  }
}
