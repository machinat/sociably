// @flow
import type { MachinatWorker } from 'machinat-base/types';
import type MachinatQueue from 'machinat-queue';
import type { JobResponse } from 'machinat-queue/types';

import type { WebSocketJob, WebSocketResult } from './types';
import type Distributor from './distributor';

class WebSocketWorker implements MachinatWorker<WebSocketJob, WebSocketResult> {
  _started: boolean;
  distributor: Distributor;

  constructor(distributor: Distributor) {
    this.distributor = distributor;
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
    const promises = [];

    for (const { scope, order } of jobs) {
      promises.push(this.distributor.broadcast(scope, order));
    }

    const socketsMetrix = await Promise.all(promises);

    const response = new Array(socketsMetrix.length);
    for (let i = 0; i < socketsMetrix.length; i += 1) {
      response[i] = {
        success: true,
        error: undefined,
        job: jobs[i],
        result: { connections: socketsMetrix[i] },
      };
    }

    return response;
  };
}

export default WebSocketWorker;
