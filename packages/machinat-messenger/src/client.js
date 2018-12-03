// @flow
import url from 'url';
import crypto from 'crypto';
import fetch from 'isomorphic-fetch';
import FormData from 'form-data';

import type MahinateQueue from 'machinat-queue';
import type { JobResponse } from 'machinat-queue/types';
import type MahinateRenderer from 'machinat-renderer';
import type { MachinatClient } from 'machinat-base/types';

import type { MachinatNode } from 'types/element';

import { GraphAPIError } from './error';
import {
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from './symbol';

import type MessengerThread from './thread';
import type {
  MessengerComponent,
  MessengerJob,
  MessengerJobResult,
  ComponentRendered,
  Recepient,
  SendOptions,
} from './types';

export type MessengerClientOptions = {
  accessToken: string,
  appSecret: ?string,
  consumeInterval: number,
};

type MessengerRenderer = MahinateRenderer<
  ComponentRendered,
  MessengerJob,
  MessengerComponent
>;

type MessengerJobQueue = MahinateQueue<MessengerJob, MessengerJobResult>;

type MessengerJobResponse = JobResponse<MessengerJob, MessengerJobResult>;

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

const makeJobName = (threadId: string, count: number) => `${threadId}:${count}`;

const makeFileName = num => `file_${num}`;

const appendFieldsToForm = (form: FormData, body: { [string]: ?string }) => {
  const fields = Object.keys(body);

  for (let k = 0; k < fields.length; k += 1) {
    const field = fields[k];
    const value = body[field];

    if (value) form.append(field);
  }

  return form;
};

export default class MessengerClient
  implements MachinatClient<MessengerJobResult> {
  token: string;
  consumeInterval: number;
  appSecretProof: ?string;
  _queue: MessengerJobQueue;
  _renderer: MessengerRenderer;
  _consumptionTimeoutId: TimeoutID | Symbol | null;

  constructor(
    queue: MessengerJobQueue,
    renderer: MessengerRenderer,
    { consumeInterval, appSecret, accessToken }: MessengerClientOptions
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

    this._consumptionTimeoutId = null;
  }

  async send(
    recipient: string | Recepient | MessengerThread,
    nodes: MachinatNode,
    options: SendOptions
  ): Promise<void | MessengerJobResult[]> {
    let thread = recipient;
    if (typeof thread === 'string') {
      thread = { id: recipient };
    }

    const sequence = this._renderer.renderJobSequence(nodes, {
      thread,
      options,
    });

    if (!sequence) {
      return undefined;
    }

    const response = await this._queue.executeJobSequence(sequence);

    if (!response.success) {
      throw new Error(response);
    }

    // since it succeeed, the batchResult must be fullfilled
    const batchResult: MessengerJobResponse[] = (response.batchResult: any);

    const payloads: MessengerJobResult[] = new Array(batchResult.length);
    for (let i = 0; i < batchResult.length; i += 1) {
      payloads[i] = batchResult[i].payload;
    }

    return payloads;
  }

  async _request(
    method: string,
    path: string,
    body: ?Object,
    query: { [string]: string }
  ) {
    const requestURL = new url.URL(path, ENTRY);
    requestURL.searchParams.set('access_token', this.token);

    if (this.appSecretProof) {
      requestURL.searchParams.set('appsecret_proof', this.appSecretProof);
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

  _handleConsumptionAdanvancing = async (
    resolveFlow: any => void,
    rejectFlow: any => void
  ) => {
    try {
      await this._queue.acquire(50, this._consumeJob(resolveFlow, rejectFlow));
    } catch (e) {
      // TODO: handle errors
      console.error(e);
    }
  };

  _consumeJob = (resolveFlow: any => void, rejectFlow: any => void) => async (
    jobs: MessengerJob[]
  ) => {
    const threadSendingRec = new Map();
    let fileCount = 0;
    let filesForm: FormData;

    for (let i = 0; i < jobs.length; i += 1) {
      const job = jobs[i];
      const threadId = job[THREAD_IDENTIFIER] || UNKNOWN_THREAD;

      let count = threadSendingRec.get(threadId);
      if (count !== undefined) {
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

    const batchBody = {
      access_token: this.token,
      include_headers: 'false', // NOTE: Graph API param work as string
      appsecret_proof: this.appSecretProof || undefined,
      batch: JSON.stringify(jobs),
    };

    const body = hasFiles
      ? JSON.stringify(batchBody)
      : appendFieldsToForm(filesForm, batchBody);

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

    const result: MessengerJobResponse[] = new Array(batchResult.length);

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
