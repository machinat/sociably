// @flow
import invariant from 'invariant';
import url from 'url';
import fetch from 'node-fetch';

import type { MachinatNode } from 'machinat';

import { BaseClient } from 'machinat-base';
import type { MachinatClient } from 'machinat-base/types';

import Queue from 'machinat-queue';

import Renderer from 'machinat-renderer';

import type {
  LineActionValue as Action,
  LineComponent as Component,
  LineJob as Job,
  LineJobResult as Result,
  LineSendOpions as Options,
  LineSource,
} from '../types';

import UserProfile from '../userProfile';
import LineThread from '../thread';
import { LINE_NAITVE_TYPE } from '../symbol';

import * as generalElementDelegate from '../component/general';

import { LineAPIError } from './error';

import createJobs from './createJobs';

const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

const API_ENTRY = 'https://api.line.me/v2/bot/';

const LINE = 'line';

type LineClientOptions = {
  useReplyAPI: boolean,
  accessToken: string,
  connectionCapicity: number,
};

export default class LineClient
  extends BaseClient<Action, Component, Job, Result, LineThread, Options>
  implements MachinatClient<Action, Component, Job, Result, Options> {
  useReplyAPI: boolean;
  _headers: {
    'Content-Type': 'application/json',
    Authorization: string,
  };

  connectionSize: number;
  connectionCapicity: number;
  _started: boolean;
  _lockedIds: Set<string>;

  constructor({
    useReplyAPI,
    accessToken,
    connectionCapicity,
  }: LineClientOptions) {
    const queue = new Queue();
    const renderer = new Renderer(
      LINE,
      LINE_NAITVE_TYPE,
      generalElementDelegate
    );

    super(LINE, queue, renderer, createJobs({ useReplyAPI }));

    queue.onJob(() => {
      if (this._started) {
        this._consume();
      }
    });

    this.useReplyAPI = useReplyAPI;

    this._headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    this.connectionSize = 0;
    this.connectionCapicity = connectionCapicity;
    this._lockedIds = new Set();
    this._started = false;
  }

  async send(
    source: string | LineSource | LineThread,
    nodes: MachinatNode,
    options?: Options
  ) {
    const thread =
      source instanceof LineThread
        ? source
        : typeof source === 'string'
        ? new LineThread({ type: 'user', userId: source })
        : new LineThread(source);

    invariant(
      !this.useReplyAPI || (options && options.replyToken),
      `replyToken option must be given while sending when useReplyAPI set to true`
    );

    return this._sendImpl(thread, nodes, options);
  }

  async getUserProfile(source: string | LineSource | LineThread) {
    const userId =
      typeof source === 'string'
        ? source
        : source instanceof LineThread
        ? source.source.userId
        : source.userId;

    const rawResult = await this.get(`profile/${userId}`);
    return new UserProfile(rawResult);
  }

  async _request(method: string, path: string, body?: Object) {
    const requestURL = new url.URL(path, API_ENTRY);

    const response = await fetch(requestURL.href, {
      method,
      body: body && JSON.stringify(body),
      headers: this._headers,
    });

    let result;
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

    return result;
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

  startConsumingJob() {
    if (this._started) {
      return false;
    }

    this._started = true;
    this._consume();
    return true;
  }

  stopConsumingJob() {
    if (!this._started) {
      return false;
    }
    this._started = false;
    return true;
  }

  _consume() {
    const { _queue: queue, _lockedIds: lockedIds, connectionCapicity } = this;

    for (let i = 0; i < queue.length; i += 1) {
      if (this.connectionSize >= connectionCapicity) {
        break;
      }

      // $FlowFixMe i is in valid range
      const { threadId }: Job = queue.peekAt(i);
      if (!lockedIds.has(threadId)) {
        this._consumeJobAt(i, threadId);

        this.connectionSize += 1;
        lockedIds.add(threadId);
      }
    }
  }

  async _consumeJobAt(idx: number, threadId: string) {
    try {
      await this._queue.acquireAt(idx, 1, this._consumeCallback);
    } catch (e) {
      // NOTE: leave the error to the request side
    } finally {
      this.connectionSize -= 1;
      this._lockedIds.delete(threadId);
      if (this._started) {
        this._consume();
      }
    }
  }

  _consumeCallback = async ([job]: Job[]) => {
    const result = await this.post(
      job.apiEntry,
      job.hasBody ? job.body : undefined
    );

    return [{ success: true, result, job, error: undefined }];
  };
}
