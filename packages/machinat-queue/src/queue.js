// @flow
import Denque from 'denque';
import isPromise from 'p-is-promise';
import type { JobSequence } from 'machinat-renderer/types';

import type { BatchRequest, BatchResponse, JobResponse } from './types';

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
      this._respondRequestsInReange(jobsResult, start, end);
      return jobsResult; // eslint-disable-line consistent-return
    } catch (err) {
      this._failRequestsInRange(err, start, end);
      throw err;
    }
  }

  enqueueJob(...jobs: J[]) {
    for (let i = 0; i < jobs.length; i += 1) {
      this._queuedJobs.push(jobs[i]);
    }
    this._endSeq += jobs.length;
  }

  executeJobBatch(...jobs: J[]): Promise<BatchResponse<J, R>> {
    const begin = this._endSeq;
    this.enqueueJob(...jobs);
    return new Promise(this._pushWaitedRequest.bind(this, begin, this._endSeq));
  }

  async executeJobSequence(
    jobSequence: JobSequence<any, J>
  ): Promise<BatchResponse<J, R>> {
    const result: BatchResponse<J, R> = {
      success: true,
      errors: null,
      batchResult: null,
    };

    while (jobSequence.hasNext()) {
      const action = jobSequence.next();
      if (isPromise(action)) {
        await action; // eslint-disable-line no-await-in-loop
      } else {
        const {
          success,
          errors,
          batchResult,
        }: BatchResponse<J, R> = await this.executeJobBatch(...action); // eslint-disable-line no-await-in-loop

        if (result.batchResult) {
          if (batchResult) result.batchResult.push(...batchResult);
        } else {
          result.batchResult = batchResult;
        }

        if (result.errors) {
          if (errors) result.errors.push(...errors);
        } else {
          result.errors = errors;
        }

        if (!success) {
          result.success = false;
          return result;
        }
      }
    }

    return result;
  }

  get length() {
    return this._queuedJobs.length;
  }

  _respondRequestsInReange(
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
    const { response, begin: requestBegin, end: requestEnd } = request;

    const jobBegin = Math.max(begin, requestBegin);
    const jobEnd = Math.min(end, requestEnd);

    if (!response.batchResult) {
      response.batchResult = new Array(requestEnd - requestBegin);
    }

    let success = true;
    for (let seq = jobBegin; seq < jobEnd; seq += 1) {
      const jobResponse = payload.jobResps[seq - begin];

      response.batchResult[seq - requestBegin] = jobResponse;
      if (success && !jobResponse.success) {
        success = false;
      }
    }

    if (!success) {
      this._removeJobsOfRequest(request);
    }

    response.success = response.success && success;
    if (request.acquiredCount <= 1 && (request.allAcquired || !success)) {
      request.resolve(response);
      /* eslint-disable no-param-reassign */
      if (payload.rmIdx === -1) {
        payload.rmIdx = idx;
      }

      payload.rmCount += 1;
    } else {
      request.acquiredCount -= 1;
      /* eslint-enable no-param-reassign */
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

    const { response } = request;
    if (!response.errors) {
      response.errors = [];
    }

    response.errors.push(payload.reason);
    response.success = false;

    if (request.acquiredCount <= 1) {
      request.resolve(response);
      /* eslint-disable no-param-reassign */
      payload.rmCount += 1;
      if (payload.rmIdx === -1) {
        payload.rmIdx = idx;
      }
    } else {
      request.acquiredCount -= 1;
    }
    /* eslint-enable no-param-reassign */
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
    /* eslint-disable no-param-reassign */
    request.acquiredCount += 1;
    if (request.end <= end) {
      request.allAcquired = true;
    }
    /* eslint-enable no-param-reassign */
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
      response: {
        success: true,
        errors: null,
        batchResult: null,
      },
    });
  }
}
