// @flow
import url from 'url';
import crypto from 'crypto';
import fetch from 'isomorphic-fetch';
import FormData from 'form-data';

import { BaseClient } from 'machinat-base';
import type { MachinatClient } from 'machinat-base/types';

import Queue from 'machinat-queue';
import type { JobResponse } from 'machinat-queue/types';

import Renderer from 'machinat-renderer';

import type { MachinatNode } from 'machinat/types';

import MessengerThread from '../thread';

import { MESSENGER_NAITVE_TYPE } from '../symbol';
import * as generalComponents from '../component/general';
import createJobs from './createJobs';
import { GraphAPIError } from './error';

import type {
  MessengerComponent as Component,
  MessengerJob as Job,
  MessengerJobResult as Result,
  MessengerActionValue as Action,
  Recepient,
  MessengerSendOptions as Options,
} from '../types';

export type MessengerClientOptions = {
  accessToken: string,
  appSecret: ?string,
  consumeInterval: ?number,
};

type MessengerJobResponse = JobResponse<Job, Result>;

const ENTRY = 'https://graph.facebook.com/v3.1/';

const MESSENGER = 'messenger';

const GET = 'GET';
const POST = 'POST';

const REQEST_JSON_HEADERS = { 'Content-Type': 'application/json' };

const assignQueryParams = (queryParams, obj) => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    queryParams.set(key, obj[key]);
  }
};

const makeJobName = (threadId: string, count: number) => `${threadId}-${count}`;

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

export default class MessengerClient
  extends BaseClient<Action, Component, Job, Result, MessengerThread, Options>
  implements MachinatClient<Action, Component, Job, Result, Options> {
  token: string;
  consumeInterval: ?number;
  _appSecretProof: ?string;

  _consumptionTimeoutId: TimeoutID | null;
  _started: boolean;
  _isConsuming: boolean;

  constructor({
    consumeInterval,
    appSecret,
    accessToken,
  }: MessengerClientOptions) {
    const renderer = new Renderer(
      MESSENGER,
      MESSENGER_NAITVE_TYPE,
      generalComponents
    );

    const queue = new Queue();

    super(MESSENGER, queue, renderer, createJobs);

    this.token = accessToken;
    this.consumeInterval = consumeInterval;

    this._started = false;
    if (!consumeInterval) {
      queue.onJob(() => {
        if (this._started && !this._isConsuming) {
          this._consume();
        }
      });
    }

    this._appSecretProof = appSecret
      ? crypto
          .createHmac('sha256', appSecret)
          .update(accessToken)
          .digest('hex')
      : undefined;

    this._consumptionTimeoutId = null;
  }

  async send(
    recipient: string | Recepient | MessengerThread,
    nodes: MachinatNode,
    options?: Options
  ) {
    const thread =
      recipient instanceof MessengerThread
        ? recipient
        : typeof recipient === 'string'
        ? new MessengerThread({ id: recipient })
        : new MessengerThread(recipient);

    return this._sendImpl(thread, nodes, options);
  }

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

  startConsumingJob() {
    if (!this._started) {
      this._started = true;
      this._consume();
      return true;
    }
    return false;
  }

  stopConsumingJob() {
    if (this._started) {
      if (this._consumptionTimeoutId !== null) {
        clearTimeout(this._consumptionTimeoutId);
        this._consumptionTimeoutId = null;
      }

      this._started = false;
      return true;
    }
    return false;
  }

  _consume = async () => {
    this._isConsuming = true;
    this._consumptionTimeoutId = null;

    while (this._queue.length > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this._queue.acquire(50, this._consumeCallback);
      } catch (e) {
        // leave the error to request side of queue to handle
      }
    }

    this._isConsuming = false;
    if (this._started && this.consumeInterval) {
      this._consumptionTimeoutId = setTimeout(
        this._consume,
        this.consumeInterval
      );
    }
  };

  _consumeCallback = async (jobs: Job[]) => {
    const threadSendingRec = new Map();
    let fileCount = 0;
    let filesForm: FormData;

    const requests = new Array(jobs.length);

    for (let i = 0; i < jobs.length; i += 1) {
      const { request, threadId, attachedFileData, attachedFileInfo } = jobs[i];

      let count = threadSendingRec.get(threadId);
      if (count !== undefined) {
        request.depends_on = makeJobName(threadId, count);
        count += 1;
      } else {
        count = 1;
      }

      threadSendingRec.set(threadId, count);
      request.name = makeJobName(threadId, count);

      if (attachedFileData !== undefined) {
        if (filesForm === undefined) filesForm = new FormData();

        const filename = makeFileName(fileCount);
        fileCount += 1;

        filesForm.append(filename, attachedFileData, attachedFileInfo);
        request.attached_files = filename;
      }

      requests[i] = request;
    }

    const hasFiles = filesForm !== undefined;
    const headers = hasFiles ? undefined : REQEST_JSON_HEADERS;

    const batchBody = {
      access_token: this.token,
      include_headers: 'false', // NOTE: Graph API param work as string
      appsecret_proof: this._appSecretProof || undefined,
      batch: JSON.stringify(requests),
    };

    const body = hasFiles
      ? appendFieldsToForm(filesForm, batchBody)
      : JSON.stringify(batchBody);

    const apiResponse = await fetch(ENTRY, { method: POST, headers, body });

    const apiBody = await apiResponse.json();
    if (!apiResponse.ok) {
      throw new GraphAPIError(apiBody);
    }

    const jobResponses: MessengerJobResponse[] = new Array(apiBody.length);

    for (let i = 0; i < jobResponses.length; i += 1) {
      const result = apiBody[i];
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
            error: new GraphAPIError(JSON.parse(result.body)),
            job: jobs[i],
          };
    }

    return jobResponses;
  };
}
