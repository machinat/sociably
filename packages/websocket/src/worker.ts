import type { MachinatWorker } from '@machinat/core/engine/types';
import MachinatQueue from '@machinat/core/queue';
import type { JobResponse } from '@machinat/core/queue/types';

import type { WebSocketJob, WebSocketResult } from './types';
import { WebSocketTransmitter } from './transmitter';

class WebSocketWorker implements MachinatWorker<WebSocketJob, WebSocketResult> {
  _started: boolean;
  transmitter: WebSocketTransmitter;

  constructor(transmitter: WebSocketTransmitter) {
    this.transmitter = transmitter;
    this._started = false;
  }

  start(queue: MachinatQueue<WebSocketJob, WebSocketResult>): boolean {
    if (this._started) {
      return false;
    }

    queue.onJob(this._listenJobsCallback);

    this._started = true;
    return true;
  }

  stop(queue: MachinatQueue<WebSocketJob, WebSocketResult>): boolean {
    if (!this._started) {
      return false;
    }

    queue.offJob(this._listenJobsCallback);

    this._started = false;
    return true;
  }

  _listenJobsCallback = this._listenJobs.bind(this);

  _listenJobs(queue: MachinatQueue<WebSocketJob, WebSocketResult>): void {
    queue.acquire(queue.length, this._executeJobsCallback);
  }

  _executeJobsCallback = this._executeJobs.bind(this);

  async _executeJobs(
    jobs: WebSocketJob[]
  ): Promise<JobResponse<WebSocketJob, WebSocketResult>[]> {
    const promises = jobs.map((job) => this.transmitter.dispatch(job));
    const socketsMetrix = await Promise.all(promises);

    const response = socketsMetrix.map((connections, i) => ({
      success: true as const,
      error: undefined,
      job: jobs[i],
      result: { connections },
    }));

    return response;
  }
}

export default WebSocketWorker;