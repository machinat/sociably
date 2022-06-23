import type { SociablyWorker } from '@sociably/core/engine';
import SociablyQueue from '@sociably/core/queue';
import type { JobResponse } from '@sociably/core/queue';

import type { WebSocketServer } from './server';
import type { WebSocketJob, WebSocketResult } from './types';

class WebSocketWorker implements SociablyWorker<WebSocketJob, WebSocketResult> {
  _started: boolean;
  server: WebSocketServer<any, unknown>;

  constructor(server: WebSocketServer<any, unknown>) {
    this.server = server;
    this._started = false;
  }

  start(queue: SociablyQueue<WebSocketJob, WebSocketResult>): boolean {
    if (this._started) {
      return false;
    }

    queue.onJobs(this._listenJobsCallback);

    this._started = true;
    return true;
  }

  stop(queue: SociablyQueue<WebSocketJob, WebSocketResult>): boolean {
    if (!this._started) {
      return false;
    }

    queue.removeJobsListener(this._listenJobsCallback);

    this._started = false;
    return true;
  }

  _listenJobsCallback = this._listenJobs.bind(this);

  _listenJobs(queue: SociablyQueue<WebSocketJob, WebSocketResult>): void {
    queue.acquire(queue.length, this._executeJobsCallback);
  }

  _executeJobsCallback = this._executeJobs.bind(this);

  async _executeJobs(
    jobs: WebSocketJob[]
  ): Promise<JobResponse<WebSocketJob, WebSocketResult>[]> {
    const promises = jobs.map((job) => this.server.dispatch(job));
    const socketsMetrix = await Promise.all(promises);

    const responses = socketsMetrix.map((connections, i) => ({
      success: true as const,
      error: undefined,
      job: jobs[i],
      result: { connections },
    }));

    return responses;
  }
}

export default WebSocketWorker;
