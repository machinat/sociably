import url from 'url';
import fetch from 'node-fetch';
import type { MachinatWorker } from '@machinat/core/engine';
import type Queue from '@machinat/core/queue';
import type { LineJob, LineResult } from './types';
import LineApiError from './error';

const API_HOST = 'https://api.line.me';

type LineJobQueue = Queue<LineJob, LineResult>;

class LineWorker implements MachinatWorker<LineJob, LineResult> {
  accessToken: string;
  connectionCount: number;
  maxConnections: number;

  private _started: boolean;
  private _lockedKeys: Set<string>;

  constructor(accessToken: string, maxConnections: number) {
    this.accessToken = accessToken;
    this.connectionCount = 0;
    this.maxConnections = maxConnections;
    this._lockedKeys = new Set();
    this._started = false;
  }

  async _request(
    method: string,
    path: string,
    body: unknown | null
  ): Promise<LineResult> {
    const requestUrl = new url.URL(path, API_HOST);

    const response = await fetch(requestUrl.href, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    let resBody;
    // catch parsing error, body can be empty string in some api
    try {
      resBody = await response.json();
    } catch (e) {
      // catch some line api respond empty string
      if (e.message.indexOf('Unexpected end of JSON input') === -1) {
        throw e;
      }
      resBody = {};
    }

    const result = {
      code: response.status,
      headers: Object.fromEntries(response.headers),
      body: resBody,
    };

    if (!response.ok) {
      throw new LineApiError(result);
    }

    return result;
  }

  get started(): boolean {
    return this._started;
  }

  start(queue: LineJobQueue): boolean {
    if (this._started) {
      return false;
    }

    queue.onJobs(this._consumeCallback);
    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: LineJobQueue): boolean {
    if (!this._started) {
      return false;
    }

    this._started = false;
    queue.removeJobsListener(this._consumeCallback);
    return true;
  }

  private _consumeCallback = this._consume.bind(this);

  private _consume(queue: Queue<LineJob, LineResult>) {
    const { _lockedKeys: lockedIds, maxConnections } = this;

    for (let i = 0; i < queue.length; ) {
      if (this.connectionCount >= maxConnections) {
        break;
      }

      const { executionKey } = queue.peekAt(i) as LineJob;
      if (executionKey !== undefined && lockedIds.has(executionKey)) {
        i += 1;
      } else {
        this._consumeJobAt(queue, i, executionKey);

        this.connectionCount += 1;

        if (executionKey !== undefined) {
          lockedIds.add(executionKey);
        }
      }
    }
  }

  private async _consumeJobAt(
    queue: Queue<LineJob, LineResult>,
    idx: number,
    executionKey: undefined | string
  ) {
    try {
      await queue.acquireAt(idx, 1, this._executeJobCallback);
    } catch (e) {
      // NOTE: leave the error to the request side
    } finally {
      this.connectionCount -= 1;

      if (executionKey !== undefined) {
        this._lockedKeys.delete(executionKey);
      }

      if (this._started) {
        this._consume(queue);
      }
    }
  }

  private _executeJobCallback = this._executeJob.bind(this);

  private async _executeJob([job]: LineJob[]) {
    const { method, path, body } = job;
    const result = await this._request(method, path, body);

    return [{ success: true, result, job, error: undefined }];
  }
}

export default LineWorker;
