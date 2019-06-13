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

  _executeJobs = async (jobs: WebSocketJob[]) => {
    const promises = [];

    for (const job of jobs) {
      promises.push(this.distributor.broadcast(job));
    }

    const socketsAffectedByjobs = await Promise.all(promises);

    const results: JobResponse<WebSocketJob, WebSocketResult>[] = new Array(
      socketsAffectedByjobs.length
    );

    for (let i = 0; i < socketsAffectedByjobs.length; i += 1) {
      results[i] = {
        success: true,
        error: undefined,
        job: jobs[i],
        result: { sockets: socketsAffectedByjobs[i] },
      };
    }

    return results;
  };
}

export default WebSocketWorker;
