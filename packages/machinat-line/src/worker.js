// @flow
import url from 'url';
import fetch from 'node-fetch';

import type { MachinatWorker } from 'machinat-base/types';
import type Queue from 'machinat-queue';

import type { LineJob, LineAPIResult } from './types';

import { LineAPIError } from './error';

const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

const API_HOST = 'https://api.line.me';

type LineClientOptions = {
  accessToken: string,
  connectionCapicity: number,
};

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
  _lockedIds: Set<string>;

  constructor({ accessToken, connectionCapicity }: LineClientOptions) {
    this._headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    this.connectionSize = 0;
    this.connectionCapicity = connectionCapicity;
    this._lockedIds = new Set();
  }

  async _request(method: string, path: string, body?: Object): LineAPIResult {
    const requestURL = new url.URL(path, API_HOST);

    const response = await fetch(requestURL.href, {
      method,
      body: body && JSON.stringify(body),
      headers: this._headers,
    });

    let result;
    // catch parsing error since body can be empty in some api
    try {
      result = await response.json();
    } catch (e) {
      if (e.message.indexOf('Unexpected end of JSON input') === -1) {
        throw e;
      }
    }

    if (!response.ok) {
      // eslint-disable-next-line no-unsafe-finally
      throw new LineAPIError(response.statusText, result);
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

    queue.onJob(this._listenJob);
    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: LineJobQueue) {
    if (!this._started) {
      return false;
    }

    this._started = false;
    queue.offJob(this._listenJob);
    return true;
  }

  _listenJob = (queue: Queue<LineJob, LineAPIResult>) => {
    this._consume(queue);
  };

  _consume(queue: Queue<LineJob, LineAPIResult>) {
    const { _lockedIds: lockedIds, connectionCapicity } = this;

    for (let i = 0; i < queue.length; ) {
      if (this.connectionSize >= connectionCapicity) {
        break;
      }

      // $FlowFixMe i is in valid range
      const { channelUid }: LineJob = queue.peekAt(i);
      if (channelUid !== undefined && lockedIds.has(channelUid)) {
        i += 1;
      } else {
        this._consumeJobAt(queue, i, channelUid);

        this.connectionSize += 1;

        if (channelUid !== undefined) {
          lockedIds.add(channelUid);
        }
      }
    }
  }

  async _consumeJobAt(
    queue: Queue<LineJob, LineAPIResult>,
    idx: number,
    channelUid: void | string
  ) {
    try {
      await queue.acquireAt(idx, 1, this._consumeCallback);
    } catch (e) {
      // NOTE: leave the error to the request side
    } finally {
      this.connectionSize -= 1;

      if (channelUid !== undefined) {
        this._lockedIds.delete(channelUid);
      }

      if (this._started) {
        this._consume(queue);
      }
    }
  }

  _consumeCallback = async ([job]: LineJob[]) => {
    const { method, path, body } = job;
    const result = await this._request(method, path, body);

    return [{ success: true, result, job, error: undefined }];
  };
}
