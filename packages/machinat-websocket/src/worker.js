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

    for (const { channel, order } of jobs) {
      promises.push(this.distributor.broadcast(channel, order));
    }

    const socketsMetrix = await Promise.all(promises);

    const results = new Array(socketsMetrix.length);
    for (let i = 0; i < socketsMetrix.length; i += 1) {
      results[i] = {
        success: true,
        error: undefined,
        job: jobs[i],
        result: { sockets: socketsMetrix[i] },
      };
    }

    return results;
  };
}

export default WebSocketWorker;
