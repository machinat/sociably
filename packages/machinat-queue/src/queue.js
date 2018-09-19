// @flow
import Denque from 'denque';
import invariant from 'invariant';
import { Utils } from 'machinat-shared';
import type { MachinatElement } from 'types/element';

const { isImmediately } = Utils;

type JobResponse = {|
  success: boolean,
  payload: any,
|};

type BatchResponse = {|
  success: boolean,
  errors: ?Array<Error>,
  batchResult: ?Array<void | JobResponse>,
|};

type BatchRequest = {|
  begin: number,
  end: number,
  resolve: BatchResponse => void,
  allAcquired: boolean,
  acquiredCount: number,
  response: BatchResponse,
|};

export default class MachinatQueue<Job: Object> {
  _beginSeq: number;
  _endSeq: number;
  _queuedJobs: Denque<Job>;
  _waitedRequets: Denque<BatchRequest>;

  constructor() {
    this._beginSeq = 0;
    this._endSeq = 0;
    this._queuedJobs = new Denque();
    this._waitedRequets = new Denque();
  }

  async acquire(
    n: number,
    consume: (Job[]) => Promise<JobResponse[]>
  ): Promise<void | JobResponse[]> {
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

  enqueueJob(...jobs: Job[]) {
    for (let i = 0; i < jobs.length; i += 1) {
      this._queuedJobs.push(jobs[i]);
    }
    this._endSeq += jobs.length;
  }

  enqueueJobAndWait(...jobs: Job[]): Promise<BatchResponse> {
    const begin = this._endSeq;
    this.enqueueJob(...jobs);
    return new Promise(this._pushWaitedRequest.bind(this, begin, this._endSeq));
  }

  async executeJobSequence(
    jobSequence: Array<Array<Job> | MachinatElement<Symbol>>
  ) {
    const result: BatchResponse = {
      success: true,
      errors: null,
      batchResult: null,
    };

    for (let i = 0; i < jobSequence.length; i += 1) {
      const action = jobSequence[i];
      if (isImmediately(action)) {
        const { after } = action.props;

        if (after && typeof after === 'function') {
          await after(); // eslint-disable-line no-await-in-loop
        } else {
          invariant(
            !after,
            `"after" prop of Immediately element should be a function, got ${after}`
          );
        }
      } else {
        const {
          success,
          errors,
          batchResult,
        }: BatchResponse = await this.enqueueJobAndWait(...action); // eslint-disable-line no-await-in-loop

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
    jobResps: JobResponse[],
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
    payload: { rmIdx: number, rmCount: number, jobResps: JobResponse[] },
    request: BatchRequest,
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
    request: BatchRequest,
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
    request: BatchRequest,
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

  // FIXME: should be written as class method instead of function propery,
  //        but flow generic syntax in class method breaks the highlight.
  _reduceRequestInRange = <Acc>(
    begin: number,
    end: number,
    reducer: (
      reduced: Acc,
      request: BatchRequest,
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

  _removeJobsOfRequest(request: BatchRequest) {
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
