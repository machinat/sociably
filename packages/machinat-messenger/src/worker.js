// @flow
import url from 'url';
import crypto from 'crypto';
import fetch from 'isomorphic-fetch';
import FormData from 'form-data';

import type { MachinatWorker } from 'machinat-base/types';
import type { JobResponse } from 'machinat-queue/types';

import { GraphAPIError } from './error';

import type {
  MessengerJob,
  MessengerAPIResult,
  MessengerQueue,
  MessengerRequest,
} from './types';

export type MessengerWorkerOptions = {
  accessToken: string,
  appSecret: ?string,
  consumeInterval: ?number,
};

type MessengerJobResponse = JobResponse<MessengerJob, MessengerAPIResult>;

const ENTRY = 'https://graph.facebook.com/v3.3/';

const GET = 'GET';
const POST = 'POST';

const REQEST_JSON_HEADERS = { 'Content-Type': 'application/json' };

const appendField = (body: string, key: string, value: string) =>
  `${body.length === 0 ? body : `${body}&`}${key}=${encodeURIComponent(value)}`;

const encodeURIBody = (fields: { [string]: any }): string => {
  let body = '';

  for (const key of Object.keys(fields)) {
    const fieldValue = fields[key];

    if (fieldValue !== undefined) {
      body = appendField(
        body,
        key,
        typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
      );
    }
  }

  return body;
};

const formatRequest = (request: MessengerRequest) => ({
  ...request,
  body: request.body && encodeURIBody(request.body),
});

const assignQueryParams = (queryParams, obj) => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    queryParams.set(key, obj[key]);
  }
};

const makeRequestName = (channelId: string, count: number) =>
  `${channelId}-${count}`;

const makeFileName = num => `file_${num}`;

const appendFieldsToForm = (form: FormData, body: { [string]: ?string }) => {
  const fields = Object.keys(body);

  for (let k = 0; k < fields.length; k += 1) {
    const field = fields[k];
    const value = body[field];

    if (value) form.append(field, value);
  }

  return form;
};

export default class MessengerWorker
  implements MachinatWorker<MessengerJob, MessengerAPIResult> {
  token: string;
  consumeInterval: ?number;
  _appSecretProof: ?string;

  _started: boolean;
  _isConsuming: boolean;
  _consumptionTimeoutId: TimeoutID | null;

  constructor({
    consumeInterval,
    appSecret,
    accessToken,
  }: MessengerWorkerOptions) {
    this.token = accessToken;
    this.consumeInterval = consumeInterval;

    this._appSecretProof = appSecret
      ? crypto
          .createHmac('sha256', appSecret)
          .update(accessToken)
          .digest('hex')
      : undefined;

    this._started = false;
    this._consumptionTimeoutId = null;
  }

  get started() {
    return this._started;
  }

  start(queue: MessengerQueue) {
    if (this._started) {
      return false;
    }

    if (!this.consumeInterval) {
      queue.onJob(this._listenJob);
    }

    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: MessengerQueue) {
    if (!this._started) {
      return false;
    }

    if (this._consumptionTimeoutId !== null) {
      clearTimeout(this._consumptionTimeoutId);
      this._consumptionTimeoutId = null;
    }

    this._started = false;
    queue.offJob(this._listenJob);
    return true;
  }

  _listenJob = (queue: MessengerQueue) => {
    if (this._started) {
      this._consume(queue);
    }
  };

  async _request(
    method: string,
    path: string,
    body: ?Object,
    query: { [string]: string }
  ) {
    const requestURL = new url.URL(path, ENTRY);
    requestURL.searchParams.set('access_token', this.token);

    if (this._appSecretProof) {
      requestURL.searchParams.set('appsecret_proof', this._appSecretProof);
    }

    if (query !== undefined) {
      assignQueryParams(requestURL.searchParams, query);
    }

    const response = await fetch(requestURL.href, {
      method,
      body: body && JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new GraphAPIError(result);
    }

    return result;
  }

  get(path: string, query: Object) {
    return this._request(GET, path, undefined, query);
  }

  post(path: string, body: Object, query: Object) {
    return this._request(POST, path, body, query);
  }

  _consume = async (queue: MessengerQueue) => {
    this._isConsuming = true;
    this._consumptionTimeoutId = null;

    while (queue.length > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await queue.acquire(50, this._consumeCallback);
      } catch (e) {
        // leave the error to request side of queue to handle
      }
    }

    this._isConsuming = false;
    if (this._started && this.consumeInterval) {
      this._consumptionTimeoutId = setTimeout(
        this._consume,
        this.consumeInterval,
        queue
      );
    }
  };

  _consumeCallback = async (jobs: MessengerJob[]) => {
    const channelSendingRec = new Map();
    let fileCount = 0;
    let filesForm: FormData;

    const requests = new Array(jobs.length);

    for (let i = 0; i < jobs.length; i += 1) {
      const {
        request,
        channelUid,
        attachmentFileData,
        attachmentFileInfo,
      } = jobs[i];

      if (channelUid !== undefined) {
        // keep the order of requests per channel
        let count = channelSendingRec.get(channelUid);
        if (count !== undefined) {
          request.depends_on = makeRequestName(channelUid, count);
          count += 1;
        } else {
          count = 1;
        }

        channelSendingRec.set(channelUid, count);
        request.name = makeRequestName(channelUid, count);
      }

      request.omit_response_on_success = false;

      // if binary data attached, use from-data and add the file field
      if (attachmentFileData !== undefined) {
        if (filesForm === undefined) {
          filesForm = new FormData();
        }

        const filename = makeFileName(fileCount);
        fileCount += 1;

        filesForm.append(filename, attachmentFileData, attachmentFileInfo);
        request.attached_files = filename;
      }

      requests[i] = formatRequest(request);
    }

    const hasFiles = filesForm !== undefined;
    const headers = hasFiles ? undefined : REQEST_JSON_HEADERS;

    const batchBody = {
      access_token: this.token,
      appsecret_proof: this._appSecretProof || undefined,
      batch: JSON.stringify(requests),
    };

    // use formdata if files attached, otherwise json
    const body = hasFiles
      ? appendFieldsToForm(filesForm, batchBody)
      : JSON.stringify(batchBody);

    const apiResponse = await fetch(ENTRY, { method: POST, headers, body });

    // if batch respond with error, throw it
    const apiBody = await apiResponse.json();
    if (!apiResponse.ok) {
      throw new GraphAPIError(apiBody);
    }

    const jobResponses: MessengerJobResponse[] = new Array(apiBody.length);

    for (let i = 0; i < jobResponses.length; i += 1) {
      const result = apiBody[i];
      result.body = JSON.parse(result.body);

      const success = result.code >= 200 && result.code < 300;

      jobResponses[i] = success // NOTE: to help flow recognize which case it is
        ? {
            success: true,
            result,
            error: undefined,
            job: jobs[i],
          }
        : {
            success: false,
            result,
            error: new GraphAPIError(result.body),
            job: jobs[i],
          };
    }

    return jobResponses;
  };
}
