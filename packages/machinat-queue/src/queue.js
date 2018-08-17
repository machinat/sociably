// @flow
import Denque from 'denque';

type JobResult = {
  success: boolean,
  payload: any,
};

type RequestResponse = {
  error: any,
  batchResult: Array<void | JobResult>,
};

type BatchRequest = {
  resolve: RequestResponse => void,
  begin: number,
  end: number,
  result: Array<void | JobResult>,
};

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
    consume: (Job[]) => Promise<JobResult[]>
  ): Promise<void | JobResult[]> {
    const jobs = this._queuedJobs.remove(0, n);
    if (jobs === undefined) {
      return;
    }
    const start = this._beginSeq;
    const end = start + jobs.length;
    this._beginSeq = end;

    try {
      const jobsResult = await consume(jobs);
      this._respondWaited(jobsResult, start, end);
      return jobsResult; // eslint-disable-line consistent-return
    } catch (err) {
      this._failWaited(err, start, end);
      throw err;
    }
  }

  enqueueJob(...jobs: Job[]) {
    for (let i = 0; i < jobs.length; i += 1) {
      this._queuedJobs.push(jobs[i]);
    }
    this._endSeq += jobs.length;
  }

  enqueueJobAndWait(...jobs: Job[]) {
    const begin = this._endSeq;
    this.enqueueJob(...jobs);
    return new Promise(this._pushWaitedRequest.bind(this, begin, this._endSeq));
  }

  get length() {
    return this._queuedJobs.length;
  }

  _respondWaited(jobsResult: JobResult[], begin: number, end: number) {
    let request;
    // eslint-disable-next-line no-cond-assign
    while ((request = this._waitedRequets.peekFront()) && request.begin < end) {
      const jobBegin = Math.max(begin, request.begin);
      const jobEnd = Math.min(end, request.end);
      for (let i = jobBegin; i < jobEnd; i += 1) {
        request.result[i - request.begin] = jobsResult[i - begin];
      }

      // FIXME: should handle previously acquired but not resolved yet
      if (end >= request.end) {
        request.resolve({ error: null, batchResult: request.result });
        this._waitedRequets.shift();
      } else {
        break;
      }
    }
  }

  _failWaited(reason: Error, begin: number, end: number) {
    let request;
    // eslint-disable-next-line no-cond-assign
    while ((request = this._waitedRequets.peekFront()) && request.begin < end) {
      // FIXME: should handle previously acquired but not resolved yet
      request.resolve({ error: reason, batchResult: request.result });
      this._waitedRequets.shift();
    }
  }

  _pushWaitedRequest(begin: number, end: number, resolve: Function) {
    this._waitedRequets.push({
      begin,
      end,
      resolve,
      result: new Array(end - begin),
    });
  }
}
