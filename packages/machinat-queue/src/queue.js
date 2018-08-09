// @flow
import Deque from 'denque';

type MachinatQueueOptions = {
  acquisitionLimit: number,
};

export default class MachinatQueue {
  acquisitionLimit: number;
  acquisitionCount: number;
  _hasLimit: boolean;
  _waitingQueue: Array<Function>;
  _deque: Deque;

  constructor(options: MachinatQueueOptions) {
    this.acquisitionLimit = options && options.acquisitionLimit;
    this.acquisitionCount = 0;
    this._hasLimit = !!this.acquisitionLimit;
    this._waitingQueue = new Deque();
    this._deque = new Deque();
  }

  async acquire(n: Number, consume: (Array<Object>) => Promise<void>) {
    await this._registerAcquisition();
    const jobs = this._deque.remove(0, n);
    try {
      const result = await consume(jobs);
      return result;
    } catch (e) {
      for (let i = jobs.length - 1; i >= 0; i -= 1) {
        this._deque.unshift(jobs[i]);
      }
      throw e;
    } finally {
      this._releaseAcquisition();
    }
  }

  enqueue(...jobs: Array<Object>) {
    for (let i = 0; i < jobs.length; i += 1) {
      this._deque.push(jobs[i]);
    }
  }

  get length() {
    return this._deque.length;
  }

  async _registerAcquisition() {
    if (this._hasLimit && this.acquisitionCount >= this.acquisitionLimit) {
      await new Promise(this._pushToWaitingQueue);
    }
    this.acquisitionCount += 1;
  }

  _releaseAcquisition() {
    this.acquisitionCount -= 1;
    const next = this._waitingQueue.shift();
    if (next !== undefined) {
      next();
    }
  }

  _pushToWaitingQueue = (resolve: Function) => {
    this._waitingQueue.push(resolve);
  };
}
