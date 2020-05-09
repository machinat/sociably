// @flow
import type { MachinatWorker } from '@machinat/core/engine/types';
import type MachinatQueue from '@machinat/core/queue';
import type { JobResponse } from '@machinat/core/queue/types';

import type { WebSocketJob, WebSocketResult } from './types';
import Transmitter from './transmitter';

class WebSocketWorker implements MachinatWorker<WebSocketJob, WebSocketResult> {
  _started: boolean;
  transmitter: Transmitter;

  constructor(transmitter: Transmitter) {
    this.transmitter = transmitter;
    this._started = false;
  }

  start(queue: MachinatQueue<WebSocketJob, WebSocketResult>) {
    if (this._started) {
      return false;
    }

    queue.onJob(this._listenJobs);

    this._started = true;
    return true;
  }

  stop(queue: MachinatQueue<WebSocketJob, WebSocketResult>) {
    if (!this._started) {
      return false;
    }

    queue.offJob(this._listenJobs);

    this._started = false;
    return true;
  }

  _listenJobs = (queue: MachinatQueue<WebSocketJob, WebSocketResult>) => {
    queue.acquire(queue.length, this._executeJobs);
  };

  _executeJobs = async (
    jobs: WebSocketJob[]
  ): Promise<JobResponse<WebSocketJob, WebSocketResult>[]> => {
    const promises = jobs.map((job) => this.transmitter.dispatch(job));
    const socketsMetrix = await Promise.all(promises);

    const response = socketsMetrix.map((connections, i) => ({
      success: true,
      error: undefined,
      job: jobs[i],
      result: { connections },
    }));
    return response;
  };
}

export default WebSocketWorker;
