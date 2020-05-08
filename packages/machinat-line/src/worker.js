// @flow
import url from 'url';
import fetch from 'node-fetch';

import type { MachinatWorker } from '@machinat/core/engine/types';
import type Queue from '@machinat/core/queue';

import type { LineJob, LineAPIResult } from './types';
import { LineAPIError } from './error';

const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

const API_HOST = 'https://api.line.me';

type LineJobQueue = Queue<LineJob, LineAPIResult>;

export default class LineClient
  implements MachinatWorker<LineJob, LineAPIResult> {
  _headers: {
    'Content-Type': 'application/json',
    Authorization: string,
  };

  _started: boolean;
  connectionSize: number;
  connectionCapicity: number;
  _lockedKeys: Set<string>;

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

  async _request(method: string, path: string, body: ?Object): LineAPIResult {
    const requestURL = new url.URL(path, API_HOST);

    const response = await fetch(requestURL.href, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: this._headers,
    });

    let result;
    // catch parsing error since body can be empty in some api
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

  get(path: string) {
    return this._request(GET, path);
  }

  post(path: string, body?: Object) {
    return this._request(POST, path, body);
  }

  put(path: string, body?: Object) {
    return this._request(PUT, path, body);
  }

  delete(path: string, body?: Object) {
    return this._request(DELETE, path, body);
  }

  get started() {
    return this._started;
  }

  start(queue: LineJobQueue) {
    if (this._started) {
      return false;
    }

    queue.onJob(this._consumeCallback);
    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: LineJobQueue) {
    if (!this._started) {
      return false;
    }

    this._started = false;
    queue.offJob(this._consumeCallback);
    return true;
  }

  _consumeCallback = this._consume.bind(this);

  _consume(queue: Queue<LineJob, LineAPIResult>) {
    const { _lockedKeys: lockedIds, connectionCapicity } = this;

    for (let i = 0; i < queue.length; ) {
      if (this.connectionSize >= connectionCapicity) {
        break;
      }

      // $FlowFixMe i is in valid range
      const { executionKey }: LineJob = queue.peekAt(i);
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

  async _consumeJobAt(
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

  _executeJobCallback = this._executeJob.bind(this);

  async _executeJob([job]: LineJob[]) {
    const { method, path, body } = job;
    const result = await this._request(method, path, body);

    return [{ success: true, result, job, error: undefined }];
  }
}
