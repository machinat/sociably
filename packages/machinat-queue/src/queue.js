// @flow
/* eslint-disable no-param-reassign */
import Denque from 'denque';

import type { JobBatchResponse, JobResponse } from './types';

type BatchRequest<Job, Result> = {|
  begin: number,
  end: number,
  resolve: (JobBatchResponse<Job, Result>) => void,
  allAcquired: boolean,
  acquiredCount: number,
  success: boolean,
  errors: ?(Error[]),
  batch: ?Array<void | JobResponse<Job, Result>>,
|};

export default class MachinatQueue<J, R> {
  _beginSeq: number;
  _endSeq: number;
  _queuedJobs: Denque<J>;
  _waitedRequets: Denque<BatchRequest<J, R>>;

  constructor() {
    this._beginSeq = 0;
    this._endSeq = 0;
    this._queuedJobs = new Denque();
    this._waitedRequets = new Denque();
  }

  async acquire(
    n: number,
    consume: (J[]) => Promise<JobResponse<J, R>[]>
  ): Promise<void | JobResponse<J, R>[]> {
    const jobs = this._queuedJobs.remove(0, n);
    if (jobs === undefined) {
      return undefined;
    }
    const start = this._beginSeq;
    const end = start + jobs.length;
    this._beginSeq = end;
    this._registerAcquisitionInRange(start, end);

    try {
      const jobsResult = await consume(jobs);
      this._respondRequestsInRange(jobsResult, start, end);
      return jobsResult; // eslint-disable-line consistent-return
    } catch (err) {
      this._failRequestsInRange(err, start, end);
      throw err;
    }
  }

  enqueueJobs(...jobs: J[]) {
    for (let i = 0; i < jobs.length; i += 1) {
      this._queuedJobs.push(jobs[i]);
    }
    this._endSeq += jobs.length;
  }

  executeJobs(...jobs: J[]): Promise<JobBatchResponse<J, R>> {
    const begin = this._endSeq;
    this.enqueueJobs(...jobs);
    return new Promise(this._pushWaitedRequest.bind(this, begin, this._endSeq));
  }

  get length() {
    return this._queuedJobs.length;
  }

  _respondRequestsInRange(
    jobResps: JobResponse<J, R>[],
    begin: number,
    end: number
  ) {
    const { rmIdx, rmCount } = this._reduceRequestInRange(
      begin,
      end,
      this._respondRequestReducer,
      { jobResps, rmIdx: -1, rmCount: 0 }
    );
    this._waitedRequets.remove(rmIdx, rmCount);
  }

  _respondRequestReducer = (
    payload: {
      rmIdx: number,
      rmCount: number,
      jobResps: JobResponse<J, R>[],
    },
    request: BatchRequest<J, R>,
    idx: number,
    begin: number,
    end: number
  ) => {
    const { begin: requestBegin, end: requestEnd } = request;

    const jobBegin = Math.max(begin, requestBegin);
    const jobEnd = Math.min(end, requestEnd);

    if (!request.batch) {
      request.batch = new Array(requestEnd - requestBegin);
    }

    let success = true;
    for (let seq = jobBegin; seq < jobEnd; seq += 1) {
      const jobResponse = payload.jobResps[seq - begin];

      request.batch[seq - requestBegin] = jobResponse;
      if (!jobResponse.success) {
        if (success) success = false;

        if (!request.errors) request.errors = [];
        request.errors.push(jobResponse.error);
      }
    }

    if (!success) {
      this._removeJobsOfRequest(request);
    }

    request.success = request.success && success;
    if (request.acquiredCount <= 1 && (request.allAcquired || !success)) {
      request.resolve(
        // NOTE: either SuccessJobResponse or FailedJobResponse should be fulfilled here
        ({
          success: request.success,
          errors: request.errors,
          batch: request.batch,
        }: any)
      );

      if (payload.rmIdx === -1) {
        payload.rmIdx = idx;
      }

      payload.rmCount += 1;
    } else {
      request.acquiredCount -= 1;
    }

    return payload;
  };

  _failRequestsInRange(reason: Error, begin: number, end: number) {
    const { rmIdx, rmCount } = this._reduceRequestInRange(
      begin,
      end,
      this._failRequestsReducer,
      { reason, rmIdx: -1, rmCount: 0 }
    );

    this._waitedRequets.remove(rmIdx, rmCount);
  }

  _failRequestsReducer = (
    payload: { rmIdx: number, rmCount: number, reason: any },
    request: BatchRequest<J, R>,
    idx: number
  ) => {
    this._removeJobsOfRequest(request);

    request.success = false;

    if (request.errors) {
      request.errors.push(payload.reason);
    } else {
      request.errors = [payload.reason];
    }

    if (request.acquiredCount <= 1) {
      request.resolve({
        success: false,
        errors: (request.errors: any), // NOTE: it is refined above
        batch: request.batch,
      });

      payload.rmCount += 1;
      if (payload.rmIdx === -1) {
        payload.rmIdx = idx;
      }
    } else {
      request.acquiredCount -= 1;
    }

    return payload;
  };

  _registerAcquisitionInRange(begin: number, end: number) {
    this._reduceRequestInRange(begin, end, this._registerAcquisitionReducer);
  }

  _registerAcquisitionReducer = (
    _: void,
    request: BatchRequest<J, R>,
    idx: number,
    begin: number,
    end: number
  ) => {
    request.acquiredCount += 1;
    if (request.end <= end) {
      request.allAcquired = true;
    }
  };

  _reduceRequestInRange = <Acc>(
    begin: number,
    end: number,
    reducer: (
      reduced: Acc,
      request: BatchRequest<J, R>,
      idx: number,
      begin: number,
      end: number
    ) => Acc,
    initial: Acc
  ): Acc => {
    let reduced = initial;

    for (let i = 0; i < this._waitedRequets.length; i += 1) {
      const request = (this._waitedRequets.peekAt(i): any);

      if (request.end > begin) {
        if (request.begin < end) {
          reduced = reducer(reduced, request, i, begin, end);
        } else {
          break;
        }
      }
    }

    return reduced;
  };

  _removeJobsOfRequest(request: BatchRequest<J, R>) {
    if (request.end > this._beginSeq) {
      const removed = this._queuedJobs.remove(0, request.end - this._beginSeq);

      if (removed !== undefined) {
        this._beginSeq += removed.length;
      }
    }
  }

  _pushWaitedRequest(begin: number, end: number, resolve: Function) {
    this._waitedRequets.push({
      begin,
      end,
      resolve,
      acquiredCount: 0,
      allAcquired: false,
      success: true,
      errors: null,
      batch: null,
    });
  }
}
