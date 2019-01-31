// @flow
/* eslint-disable no-param-reassign */
import Denque from 'denque';

import type { JobBatchResponse, JobResponse } from './types';

type JobPackage<Job> = {
  seq: number,
  job: Job,
  request: BatchRequest<Job, any>,
};

type BatchRequest<Job, Result> = {|
  begin: number,
  end: number,
  resolve: (JobBatchResponse<Job, Result>) => void,
  finishedCount: number,
  acquiredCount: number,
  success: boolean,
  errors: ?(Error[]),
  responses: ?Array<void | JobResponse<Job, Result>>,
|};

const getJob = <Job>(pkg: JobPackage<Job>) => pkg.job;

const reduceRequestsOfPackages = <Job, Result, Acc>(
  pkgs: JobPackage<Job>[],
  reducer: (
    reduced: Acc,
    request: BatchRequest<Job, Result>,
    pkgs: JobPackage<Job>[],
    begin: number,
    count: number
  ) => Acc,
  initial: Acc
): Acc => {
  let jobBegin = 0;
  let lastRequest = pkgs[0].request;
  let reduced = initial;

  for (let i = 1; i <= pkgs.length; i += 1) {
    const pkg = pkgs[i];
    const loopEnded = i === pkgs.length;

    if (loopEnded || lastRequest !== pkg.request) {
      reduced = reducer(reduced, lastRequest, pkgs, jobBegin, i - jobBegin);

      if (!loopEnded) {
        lastRequest = pkg.request;
        jobBegin = i;
      }
    }
  }

  return reduced;
};

export default class MachinatQueue<Job, Result> {
  currentSeq: number;
  _queuedJobs: Denque<JobPackage<Job>>;
  _waitedRequets: Set<BatchRequest<Job, Result>>;
  _jobListeners: ((MachinatQueue<Job, Result>) => void)[];

  constructor() {
    this.currentSeq = 0;
    this._queuedJobs = new Denque();
    this._waitedRequets = new Set();
    this._jobListeners = [];
  }

  onJob(listener: (MachinatQueue<Job, Result>) => void) {
    this._jobListeners.push(listener);
  }

  _emitJobEvent() {
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
    consume: (Job[]) => Promise<JobResponse<Job, Result>[]>
  ): Promise<void | JobResponse<Job, Result>[]> {
    const pkgs = this._queuedJobs.remove(idx, count);
    if (pkgs === undefined) {
      return undefined;
    }

    this._registerAcquisition(pkgs);

    try {
      const jobs = pkgs.map(getJob);
      const jobsResult = await consume(jobs);

      this._respondRequests(pkgs, jobsResult);
      return jobsResult;
    } catch (err) {
      this._failRequests(pkgs, err);
      throw err;
    }
  }

  acquire(
    count: number,
    consume: (Job[]) => Promise<JobResponse<Job, Result>[]>
  ): Promise<void | JobResponse<Job, Result>[]> {
    return this.acquireAt(0, count, consume);
  }

  _enqueueJobs(jobs: Job[], request: BatchRequest<Job, Result>) {
    const seq = this.currentSeq;

    for (let i = 0; i < jobs.length; i += 1) {
      this._queuedJobs.push({ seq: seq + i, job: jobs[i], request });
    }

    this.currentSeq = seq + jobs.length;
    this._emitJobEvent();
  }

  executeJobs(jobs: Job[]): Promise<JobBatchResponse<Job, Result>> {
    return new Promise(this._handleJobsForWaiting.bind(this, jobs));
  }

  get length() {
    return this._queuedJobs.length;
  }

  _respondRequests(
    pkgs: JobPackage<Job>[],
    jobResps: JobResponse<Job, Result>[]
  ) {
    reduceRequestsOfPackages(pkgs, this._respondRequestReducer, jobResps);
  }

  _respondRequestReducer = (
    jobResps: JobResponse<Job, Result>[],
    request: BatchRequest<Job, Result>,
    pkgs: JobPackage<Job>[],
    begin: number,
    count: number
  ) => {
    const { begin: requestBegin, end: requestEnd } = request;

    if (!request.responses) {
      request.responses = new Array(requestEnd - requestBegin);
    }

    let success = true;
    const end = begin + count;
    for (let i = begin; i < end; i += 1) {
      const { seq } = pkgs[i];

      const jobResponse = jobResps[i];
      request.responses[seq - requestBegin] = jobResponse;

      request.finishedCount += 1;
      if (!jobResponse.success) {
        success = false;

        if (!request.errors) request.errors = [];
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
      request.resolve(
        // NOTE: either SuccessJobResponse or FailedJobResponse should be fulfilled here
        ({
          success: request.success,
          errors: request.errors,
          batch: request.responses,
        }: any)
      );

      this._waitedRequets.delete(request);
    } else {
      request.acquiredCount -= 1;
    }

    return jobResps;
  };

  _failRequests(pkgs: JobPackage<Job>[], reason: Error) {
    reduceRequestsOfPackages(pkgs, this._failRequestsReducer, reason);
  }

  _failRequestsReducer = (
    reason: Error,
    request: BatchRequest<Job, Result>,
    pkgs: JobPackage<Job>[],
    begin: number,
    count: number
  ) => {
    this._removeJobsOfRequest(request);

    request.success = false;

    if (!request.errors) request.errors = [];
    request.errors.push(reason);

    if (request.acquiredCount <= 1) {
      request.resolve({
        success: false,
        errors: (request.errors: any), // NOTE: it is refined above
        batch: request.responses,
      });

      this._waitedRequets.delete(request);
    } else {
      request.acquiredCount -= 1;
      request.finishedCount += count;
    }

    return reason;
  };

  _registerAcquisition(pkgs: JobPackage<Job>[]) {
    reduceRequestsOfPackages(pkgs, this._registerAcquisitionReducer);
  }

  _registerAcquisitionReducer = (
    _: void,
    request: BatchRequest<Job, Result>
  ) => {
    request.acquiredCount += 1;
  };

  _removeJobsOfRequest(requestToClear: BatchRequest<Job, Result>) {
    const jobLength = this._queuedJobs.length;
    let removeBegin = -1;

    for (let i = 0; i < jobLength; i += 1) {
      // $FlowFixMe i is surely safe
      const { request } = this._queuedJobs.peekAt(i);

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

  _handleJobsForWaiting(jobs: Job[], resolve: Function) {
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
    this._waitedRequets.add(request);
  }
}
