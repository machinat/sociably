import url from 'url';
import fetch from 'node-fetch';
import invariant from 'invariant';

import { API_PATH, HAS_BODY } from './symbol';
import { LineAPIError } from './error';
import UserProfile from './userProfile';

const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

const API_ENTRY = 'https://api.line.me/v2/bot/';

const IS_CONSUMING_FLAG = Symbol('__is_now_consuming__');

export default class LineClient {
  constructor(
    queue,
    renderer,
    { consumeInterval = 500, useReplyAPI, accessToken }
  ) {
    this.consumeInterval = consumeInterval;
    this.useReplyAPI = useReplyAPI;
    this._queue = queue;
    this._renderer = renderer;

    this._headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    this._consumptionTimeoutId = null;
  }

  async send(source, nodes, options) {
    invariant(!this.useReplyAPI || (options && options.replyToken));
    let thread = source;
    if (typeof thread === 'string') {
      thread = { userId: source };
    }

    const sequence = this._renderer.renderJobSequence(nodes, {
      thread,
      options,
    });

    const result = await this._queue.executeJobSequence(sequence);
    return result;
  }

  async getUserProfile(user) {
    const rawResult = await this.get(`profile/${user.userId}`);
    return new UserProfile(rawResult);
  }

  async _request(method, path, body) {
    const requestURL = new url.URL(path, API_ENTRY);

    const response = await fetch(requestURL.href, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
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

  get(path) {
    return this._request(GET, path);
  }

  post(path, body) {
    return this._request(POST, path, body);
  }

  put(path, body) {
    return this._request(PUT, path, body);
  }

  delete(path, body) {
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
    if (this._consumptionTimeoutId !== null) {
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
        console.error(e);
      }
    }

    if (this._consumptionTimeoutId === IS_CONSUMING_FLAG) {
      this._consumptionTimeoutId = setTimeout(
        this._consumeLoop,
        this.consumeInterval
      );
    }
  };

  _consumeJob = async ([job]) => {
    const result = await this.post(
      job[API_PATH],
      job[HAS_BODY] ? job : undefined
    );
    return [{ success: true, payload: result, job }];
  };
}
