import crypto from 'crypto';
import fetch from 'node-fetch';
import FormData from 'form-data';

import type { MachinatWorker } from '@machinat/core/engine';
import MachinatQueue, { JobResponse } from '@machinat/core/queue';

import GraphAPIError from './error';
import type { MessengerJob, MessengerResult, BatchApiRequest } from './types';

type MessengerSendingResponse = JobResponse<MessengerJob, MessengerResult>;

type MessengerQueue = MachinatQueue<MessengerJob, MessengerResult>;

const POST = 'POST';

const REQEST_JSON_HEADERS = { 'Content-Type': 'application/json' };

const appendField = (body: string, key: string, value: string) =>
  `${body.length === 0 ? body : `${body}&`}${key}=${encodeURIComponent(value)}`;

const encodeUriBody = (fields: { [key: string]: any }): string => {
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

const formatRequest = (request: BatchApiRequest) =>
  request.method === 'DELETE'
    ? {
        ...request,
        // NOTE: workaround because batch api do not support DELETE with body
        relative_url: request.body
          ? `${request.relative_url}?${encodeUriBody(request.body)}`
          : request.relative_url,
        body: undefined,
      }
    : {
        ...request,
        body: request.body && encodeUriBody(request.body),
      };

const makeRequestName = (channelId: string, count: number) =>
  `${channelId}-${count}`;

const makeFileName = (num: number) => `file_${num}`;

const appendFieldsToForm = (
  form: FormData,
  body: { [key: string]: string | null | undefined }
) => {
  const fields = Object.keys(body);

  for (let k = 0; k < fields.length; k += 1) {
    const field = fields[k];
    const value = body[field];

    if (value) form.append(field, value);
  }

  return form;
};

type TimeoutID = ReturnType<typeof setTimeout>;

export default class MessengerWorker
  implements MachinatWorker<MessengerJob, MessengerResult>
{
  token: string;
  consumeInterval: number;
  private _graphApiEntry: string;
  private _appSecretProof: string | undefined;

  private _started: boolean;
  // @ts-expect-error: keep for later use
  private _isConsuming: boolean;
  private _consumptionTimeoutId: TimeoutID | null;

  constructor(
    accessToken: string,
    consumeInterval: number,
    graphApiVersion: string,
    appSecret: undefined | string
  ) {
    this.token = accessToken;
    this.consumeInterval = consumeInterval;

    this._graphApiEntry = `https://graph.facebook.com/${graphApiVersion}/`;

    this._appSecretProof = appSecret
      ? crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')
      : undefined;

    this._started = false;
    this._consumptionTimeoutId = null;
  }

  get started(): boolean {
    return this._started;
  }

  start(queue: MessengerQueue): boolean {
    if (this._started) {
      return false;
    }

    if (this.consumeInterval === 0) {
      queue.onJobs(this._listenJobCallback);
    }

    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: MessengerQueue): boolean {
    if (!this._started) {
      return false;
    }

    if (this._consumptionTimeoutId !== null) {
      clearTimeout(this._consumptionTimeoutId);
      this._consumptionTimeoutId = null;
    }

    this._started = false;
    queue.removeJobsListener(this._listenJobCallback);
    return true;
  }

  private _listenJobCallback = this._listenJob.bind(this);

  private _listenJob(queue: MessengerQueue) {
    if (this._started) {
      this._consume(queue);
    }
  }

  private _consumeCallback = this._consume.bind(this);

  private async _consume(queue: MessengerQueue) {
    this._isConsuming = true;
    this._consumptionTimeoutId = null;

    while (queue.length > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await queue.acquire(50, this._executeJobsCallback);
      } catch (e) {
        // leave the error to request side of queue to handle
      }
    }

    this._isConsuming = false;
    if (this._started && this.consumeInterval !== 0) {
      this._consumptionTimeoutId = setTimeout(
        this._consumeCallback,
        this.consumeInterval,
        queue
      );
    }
  }

  private _executeJobsCallback = this._executeJobs.bind(this);

  private async _executeJobs(jobs: MessengerJob[]) {
    const channelSendingRec = new Map();
    let fileCount = 0;
    let filesForm: undefined | FormData;

    const requests = new Array(jobs.length);

    for (let i = 0; i < jobs.length; i += 1) {
      const { request, channelUid, attachmentFileData, attachmentFileInfo } =
        jobs[i];

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

    const batchBody = {
      access_token: this.token,
      appsecret_proof: this._appSecretProof || undefined,
      batch: JSON.stringify(requests),
    };

    // use formdata if files attached, otherwise json
    const body =
      filesForm !== undefined
        ? appendFieldsToForm(filesForm, batchBody)
        : JSON.stringify(batchBody);

    const apiResponse = await fetch(this._graphApiEntry, {
      method: POST,
      headers: filesForm !== undefined ? undefined : REQEST_JSON_HEADERS,
      body,
    });

    // if batch respond with error, throw it
    const apiBody = await apiResponse.json();
    if (!apiResponse.ok) {
      throw new GraphAPIError(apiBody);
    }

    const jobResponses: MessengerSendingResponse[] = new Array(apiBody.length);

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
  }
}
