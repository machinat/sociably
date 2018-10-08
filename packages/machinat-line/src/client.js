import url from 'url';
import fetch from 'node-fetch';

import { API_PATH, HAS_BODY } from './symbol';

import { LineAPIError } from './error';

const GET = 'GET';
const POST = 'POST';

const API_ENTRY = 'https://api.line.me/v2/bot/';

const IS_CONSUMING_FLAG = Symbol('__is_now_consuming__');

export default class LineClient {
  constructor(accessToken, queue, { consumeInterval = 500 }) {
    this.consumeInterval = consumeInterval;
    this._postHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };
    this._getHeaders = { Authorization: `Bearer ${accessToken}` };
    this._queue = queue;

    this._consumptionTimeoutId = null;
  }

  async _request(method, path, body) {
    const requestURL = new url.URL(path, API_ENTRY);

    const response = await fetch(requestURL.href, {
      method,
      body: JSON.stringify(body),
      headers: method === POST ? this._postHeaders : this._getHeaders,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new LineAPIError(response.statusText, result);
    }
    return result;
  }

  get(path) {
    return this._request(GET, path, null);
  }

  post(path, body) {
    return this._request(POST, path, body);
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
