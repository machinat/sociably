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

const IS_CONSUMING_FLAG = Symbol('__is_now_consuming__');

const LINE = 'line';

type LineClientOptions = {
  consumeInterval: number,
  useReplyAPI: boolean,
  accessToken: string,
};

export default class LineClient
  extends BaseClient<Action, Component, Job, Result, LineThread, Options>
  implements MachinatClient<Action, Component, Job, Result, Options> {
  consumeInterval: number;
  useReplyAPI: boolean;
  _headers: {
    'Content-Type': 'application/json',
    Authorization: string,
  };
  _consumptionTimeoutId: TimeoutID | Symbol | null;

  constructor({
    consumeInterval,
    useReplyAPI,
    accessToken,
  }: LineClientOptions) {
    const queue = new Queue();
    const renderer = new Renderer(
      LINE,
      LINE_NAITVE_TYPE,
      generalElementDelegate
    );

    super(LINE, queue, renderer, createJobs({ useReplyAPI }));

    this.consumeInterval = consumeInterval;
    this.useReplyAPI = useReplyAPI;

    this._headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    this._consumptionTimeoutId = null;
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
    if (this._consumptionTimeoutId === null) {
      this._consumeLoop();
      return true;
    }
    return false;
  }

  stopConsumingJob() {
    const { _consumptionTimeoutId } = this;
    if (
      _consumptionTimeoutId !== null &&
      typeof _consumptionTimeoutId !== 'symbol'
    ) {
      clearTimeout(this._consumptionTimeoutId);
      this._consumptionTimeoutId = null;
      return true;
    }
    return false;
  }

  _consumeLoop = async () => {
    this._consumptionTimeoutId = IS_CONSUMING_FLAG;
    while (this._queue.length > 0) {
      try {
        // TODO: jobs should be executed and awaited in the thread scope, need refactoring queue
        await this._queue.acquire(1, this._consumeJob); // eslint-disable-line no-await-in-loop
      } catch (e) {
        // TODO: handle errors
      }
    }

    if (this._consumptionTimeoutId === IS_CONSUMING_FLAG) {
      this._consumptionTimeoutId = setTimeout(
        this._consumeLoop,
        this.consumeInterval
      );
    }
  };

  _consumeJob = async ([job]: Job[]) => {
    const result = await this.post(
      job.apiEntry,
      job.hasBody ? job.body : undefined
    );

    return [{ success: true, result, job, error: undefined }];
  };
}
