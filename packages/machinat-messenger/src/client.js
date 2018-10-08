import url from 'url';
import crypto from 'crypto';
import fetch from 'isomorphic-fetch';
import FormData from 'form-data';

import { GraphAPIError } from './error';
import {
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from './symbol';

const UNKNOWN_THREAD = 'unknown_thread';

const ENTRY = 'https://graph.facebook.com/v3.1/';

const GET = 'GET';
const POST = 'POST';

const IS_CONSUMING_FLAG = Symbol('__is_consuming__');

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
  constructor(
    queue,
    renderer,
    { consumeInterval = 500, appSecret, accessToken }
  ) {
    this.token = accessToken;
    this.consumeInterval = consumeInterval;

    this._queue = queue;
    this._renderer = renderer;

    this.appSecretProof = appSecret
      ? crypto
          .createHmac('sha256', appSecret)
          .update(accessToken)
          .digest('hex')
      : undefined;
    this.batchBodyCarrier = {
      access_token: this.token,
      include_headers: 'false', // NOTE: Graph API param work as string
      appsecret_proof: this.appSecretProof || undefined,
      batch: null,
    };
    this._consumptionTimeoutId = null;
  }

  async send(recipient, nodes, options) {
    let thread = recipient;
    if (typeof thread === 'string') {
      thread = { id: recipient };
    }

    const sequence = this._renderer.renderJobSequence(nodes, {
      thread,
      options,
    });

    const result = await this._queue.executeJobSequence(sequence);
    return result;
  }

  async _request(method, path, body, query) {
    const requestURL = new url.URL(path, ENTRY);
    requestURL.searchParams.set('access_token', this.token);

    if (this.appSecretProof !== undefined) {
      requestURL.searchParams.set('appsecret_proof', this.appSecretProof);
    }

    if (query !== undefined) {
      assignQueryParams(requestURL.searchParams, query);
    }

    const response = await fetch(requestURL.href, { method, body });
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

  startConsumingJob() {
    if (this._consumptionTimeoutId === null) {
      this._startConsumingJobFlow();
      return true;
    }
    return false;
  }

  stopConsumingJob() {
    if (this._consumptionTimeoutId !== null) {
      if (this._consumptionTimeoutId !== IS_CONSUMING_FLAG) {
        clearTimeout(this._consumptionTimeoutId);
      }
      this._consumptionTimeoutId = null;
      return true;
    }
    return false;
  }

  _startConsumingJobFlow = async () => {
    this._consumptionTimeoutId = IS_CONSUMING_FLAG;
    while (this._queue.length > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(this._handleConsumptionAdanvancing);
      } catch (e) {
        // do nothing since only errors before header received go to here
      }
    }

    if (this._consumptionTimeoutId === IS_CONSUMING_FLAG) {
      this._consumptionTimeoutId = setTimeout(
        this._startConsumingJobFlow,
        this.consumeInterval
      );
    }
  };

  _handleConsumptionAdanvancing = async (resolveFlow, rejectFlow) => {
    try {
      await this._queue.acquire(50, this._consumeJob(resolveFlow, rejectFlow));
    } catch (e) {
      // TODO: handle errors
      console.error(e);
    }
  };

  _consumeJob = (resolveFlow, rejectFlow) => async jobs => {
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
