import url from 'url';
import fetch from 'isomorphic-fetch';

const ENTRY = 'https://graph.facebook.com/v3.1';

const GET = 'GET';
const POST = 'POST';

const IS_FETCHING_FLAG = Symbol('__is_fetching__');

const HEADERS = { 'Content-Type': 'application/json' };

const setObjToQueryParams = (queryParams, obj) => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    queryParams.set(key, obj[key]);
  }
};

export default class MessengerClient {
  constructor(token, queue, { consumeInterval }) {
    this.token = token;
    this.queue = queue;
    this.consumeInterval = consumeInterval || 500;
    this._nextConsumptionId = null;
  }

  async _request(method, path, body, query) {
    const queryURL = new url.URL(path, ENTRY);
    queryURL.searchParams.set('access_token', this.token);
    if (query !== undefined) {
      setObjToQueryParams(queryURL.searchParams, query);
    }

    const response = await fetch(queryURL.href, { method, body });
    if (!response.ok) {
      // TODO: throw something
    }

    const result = await response.json();
    return result;
  }

  get(path, query) {
    return this._request(GET, path, null, query);
  }

  post(path, body, query) {
    return this._request(POST, path, body, query);
  }

  startConsumingBatchJob() {
    if (this._nextConsumptionId === null) {
      this._startConsumeBatchJobFlow(this.queue);
      return true;
    }
    return false;
  }

  stopConsumingBatchJob() {
    if (this._nextConsumptionId !== null) {
      clearTimeout(this._nextConsumptionId);
      this._nextConsumptionId = null;
      return true;
    }
    return false;
  }

  _startConsumeBatchJobFlow = async () => {
    this._nextConsumptionId = IS_FETCHING_FLAG;
    while (this.queue.length > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(this._executeConsumption);
      } catch (e) {
        // do nothing?
      }
    }
    this._nextConsumptionId = setTimeout(
      this._startConsumeBatchJobFlow,
      this.consumeInterval
    );
  };

  _executeConsumption = async (resolve, reject) => {
    try {
      await this.queue.acquire(50, this._consumeBatchJob(resolve, reject));
    } catch (e) {
      console.error(e);
      // TODO: handle errors
    }
  };

  _consumeBatchJob = (resolve, reject) => async jobs => {
    let response;
    try {
      response = await fetch(ENTRY, {
        method: POST,
        headers: HEADERS,
        body: JSON.stringify({
          access_token: this.token,
          batch: JSON.stringify(jobs),
        }),
      });
      resolve(response);
    } catch (err) {
      reject(err);
      throw err;
    }
    const body = await response.json();

    if (!response.ok) {
      // throw something
    }

    const result = new Array(body.length);
    for (let i = 0; i < result.length; i += 1) {
      const payload = body[i];
      result[i] = {
        success: payload.code >= 200 && payload.code < 300,
        payload,
        job: jobs[i],
      };
    }
    return result;
  };
}
