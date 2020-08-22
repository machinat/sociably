import url from 'url';
import fetch from 'node-fetch';
import type { MachinatWorker } from '@machinat/core/engine/types';
import Queue from '@machinat/core/queue';
import type { LineJob, LineAPIResult } from './types';
import { LineAPIError } from './error';

const API_HOST = 'https://api.line.me';

type LineJobQueue = Queue<LineJob, LineAPIResult>;

export default class LineClient
  implements MachinatWorker<LineJob, LineAPIResult> {
  private _headers: {
    'Content-Type': 'application/json';
    Authorization: string;
  };

  private _started: boolean;

  connectionSize: number;
  connectionCapicity: number;
  private _lockedKeys: Set<string>;

  constructor(accessToken: string, connectionCapicity: number) {
    this._headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    this.connectionSize = 0;
    this.connectionCapicity = connectionCapicity;
    this._lockedKeys = new Set();
    this._started = false;
  }

  async _request(
    method: string,
    path: string,
    body: any | null
  ): Promise<LineAPIResult> {
    const requestURL = new url.URL(path, API_HOST);

    const response = await fetch(requestURL.href, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: this._headers,
    });

    let result: LineAPIResult;
    // catch parsing error, body can be empty string in some api
    try {
      result = await response.json();
    } catch (e) {
      // catch some line api respond empty string
      if (e.message.indexOf('Unexpected end of JSON input') === -1) {
        throw e;
      }
    }

    if (!response.ok) {
      throw new LineAPIError(response.status, result);
    }

    return result || {};
  }

  get started(): boolean {
    return this._started;
  }

  start(queue: LineJobQueue): boolean {
    if (this._started) {
      return false;
    }

    queue.onJob(this._consumeCallback);
    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: LineJobQueue): boolean {
    if (!this._started) {
      return false;
    }

    this._started = false;
    queue.offJob(this._consumeCallback);
    return true;
  }

  private _consumeCallback = this._consume.bind(this);

  private _consume(queue: Queue<LineJob, LineAPIResult>) {
    const { _lockedKeys: lockedIds, connectionCapicity } = this;

    for (let i = 0; i < queue.length; ) {
      if (this.connectionSize >= connectionCapicity) {
        break;
      }

      const { executionKey } = queue.peekAt(i) as LineJob;
      if (executionKey !== undefined && lockedIds.has(executionKey)) {
        i += 1;
      } else {
        this._consumeJobAt(queue, i, executionKey);

        this.connectionSize += 1;

        if (executionKey !== undefined) {
          lockedIds.add(executionKey);
        }
      }
    }
  }

  private async _consumeJobAt(
    queue: Queue<LineJob, LineAPIResult>,
    idx: number,
    executionKey: void | string
  ) {
    try {
      await queue.acquireAt(idx, 1, this._executeJobCallback);
    } catch (e) {
      // NOTE: leave the error to the request side
    } finally {
      this.connectionSize -= 1;

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
