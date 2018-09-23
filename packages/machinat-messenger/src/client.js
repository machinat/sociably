import url from 'url';
import crypto from 'crypto';
import fetch from 'isomorphic-fetch';
import FormData from 'form-data';

import { GraphAPIError } from './errors';
import {
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from './symbol';

const UNKNOWN_THREAD = 'unknown_thread';

const ENTRY = 'https://graph.facebook.com/v3.1';

const GET = 'GET';
const POST = 'POST';

const IS_FETCHING_FLAG = Symbol('__is_fetching__');

const REQEST_JSON_HEADERS = { 'Content-Type': 'application/json' };

const assignQueryParams = (queryParams, obj) => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    queryParams.set(key, obj[key]);
  }
};

const makeJobName = (threadId, count) => `${threadId}:${count}`;

const makeFileName = num => `file_${num}`;

const appendBodyToForm = (form, body) => {
  const fields = Object.keys(body);
  for (let k = 0; k < fields.length; k += 1) {
    const field = fields[k];
    form.append(field, body[field]);
  }
  return form;
};

export default class MessengerClient {
  constructor(token, queue, { consumeInterval, appSecret } = {}) {
    this.token = token;
    this.queue = queue;
    this.consumeInterval = consumeInterval || 500;
    this._nextConsumptionId = null;
    this.appSecretProof = appSecret
      ? crypto
          .createHmac('sha256', appSecret)
          .update(token)
          .digest('hex')
      : null;
    this.batchBodyCarrier = {
      access_token: this.token,
      include_headers: 'false', // NOTE: Graph API param only work as string
      appsecret_proof: this.appSecretProof || undefined,
      batch: null,
    };
  }

  async _request(method, path, body, query) {
    const queryURL = new url.URL(path, ENTRY);
    queryURL.searchParams.set('access_token', this.token);

    if (this.appSecretProof !== null) {
      queryURL.searchParams.set('appsecret_proof', this.appSecretProof);
    }

    if (query !== undefined) {
      assignQueryParams(queryURL.searchParams, query);
    }

    const response = await fetch(queryURL.href, { method, body });
    const result = await response.json();
    if (!response.ok) {
      throw new GraphAPIError(result);
    }
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
        await new Promise(this._handleConsumptionAdanvancing);
      } catch (e) {
        // do nothing since only errors before header received go to here
      }
    }
    this._nextConsumptionId = setTimeout(
      this._startConsumeBatchJobFlow,
      this.consumeInterval
    );
  };

  _handleConsumptionAdanvancing = async (resolveFlow, rejectFlow) => {
    try {
      await this.queue.acquire(
        50,
        this._consumeBatchJob(resolveFlow, rejectFlow)
      );
    } catch (e) {
      // TODO: handle errors
      console.error(e);
    }
  };

  _consumeBatchJob = (resolveFlow, rejectFlow) => async jobs => {
    const threadSendingRec = new Map();
    let fileCount = 0;
    let filesForm;

    for (let i = 0; i < jobs.length; i += 1) {
      const job = jobs[i];
      const threadId = job[THREAD_IDENTIFIER] || UNKNOWN_THREAD;

      let count;
      if (threadSendingRec.has(threadId)) {
        count = threadSendingRec.get(threadId);
        job.depends_on = makeJobName(threadId, count);
        count += 1;
      } else {
        count = 1;
      }

      threadSendingRec.set(threadId, count);
      job.name = makeJobName(threadId, count);

      if (job[ATTACHED_FILE_DATA] !== undefined) {
        if (filesForm === undefined) filesForm = new FormData();

        const filename = makeFileName(fileCount);
        fileCount += 1;

        filesForm.append(
          filename,
          job[ATTACHED_FILE_DATA],
          job[ATTACHED_FILE_INFO]
        );
        job.attached_files = filename;
      }
      job.omit_response_on_success = false; // FIXME: remove after job object pooled
    }

    const hasFiles = filesForm === undefined;
    const headers = hasFiles ? REQEST_JSON_HEADERS : undefined;

    this.batchBodyCarrier.batch = JSON.stringify(jobs);
    const body = hasFiles
      ? JSON.stringify(this.batchBodyCarrier)
      : appendBodyToForm(filesForm, this.batchBodyCarrier);

    let response;
    try {
      response = await fetch(ENTRY, { method: POST, headers, body });
      resolveFlow(response);
    } catch (err) {
      rejectFlow(err);
      throw err;
    }

    const batchResult = await response.json();
    if (!response.ok) {
      throw new GraphAPIError(batchResult);
    }

    const result = new Array(batchResult.length);
    for (let i = 0; i < result.length; i += 1) {
      const payload = batchResult[i];
      result[i] = {
        success: payload.code >= 200 && payload.code < 300,
        payload,
        job: jobs[i],
      };
    }
    return result;
  };
}
