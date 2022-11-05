import crypto from 'crypto';
import fetch from 'node-fetch';
import FormData from 'form-data';
import type { SociablyWorker } from '@sociably/core/engine';
import SociablyQueue, { JobResponse } from '@sociably/core/queue';
import GraphAPIError from './Error';
import formatRequest from './utils/formatRequest';
import appendFormFields from './utils/appendFormFields';
import getObjectValueByPath from './utils/getObjectValueByPath';
import type { MetaApiJob, MetaApiResult, MetaBatchRequest } from './types';

type MetaApiQueue = SociablyQueue<MetaApiJob, MetaApiResult>;

const POST = 'POST';

const REQEST_JSON_HEADERS = { 'Content-Type': 'application/json' };

const makeRequestName = (channelId: string, count: number) =>
  `${channelId}-${count}`;

const makeFileName = (num: number) => `file_${num}`;

type TimeoutID = ReturnType<typeof setTimeout>;

class MetaApiWorker implements SociablyWorker<MetaApiJob, MetaApiResult> {
  token: string;
  consumeInterval: number;
  private _graphApiEntry: string;
  private _appSecretProof: string | undefined;

  private _started: boolean;
  // @ts-expect-error: keep for later use
  private _isConsuming: boolean;
  private _consumptionTimeoutId: TimeoutID | null;

  private _resultCache: Map<string, MetaApiResult>;

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
    this._resultCache = new Map();
  }

  get started(): boolean {
    return this._started;
  }

  start(queue: MetaApiQueue): boolean {
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

  stop(queue: MetaApiQueue): boolean {
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

  private _listenJob(queue: MetaApiQueue) {
    if (this._started) {
      this._consume(queue);
    }
  }

  private _consumeCallback = this._consume.bind(this);

  private async _consume(queue: MetaApiQueue) {
    this._isConsuming = true;
    this._consumptionTimeoutId = null;

    while (queue.length > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await queue.acquire(50, this._executeJobsCallback);
      } catch {
        // leave the error to request side of queue
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

  private async _executeJobs(jobs: MetaApiJob[]) {
    const sendingKeysCounts = new Map<string, number>();
    const resultRegistry = new Map<string, { name: string; idx: number }>();
    let fileCount = 0;
    let filesForm: undefined | FormData;

    const requests = new Array(jobs.length);

    for (let i = 0; i < jobs.length; i += 1) {
      const {
        request: requestInput,
        key,
        fileData,
        fileInfo,
        registerResult,
        consumeResult,
      } = jobs[i];

      let request: MetaBatchRequest = { ...requestInput };

      // if it requires a result before to accomplish the request
      if (consumeResult) {
        const { keys: consummingKeys, accomplishRequest } = consumeResult;

        request = accomplishRequest(
          request,
          consummingKeys,
          (requestKey, path) => {
            const currentBatchRegistered = resultRegistry.get(requestKey);
            if (currentBatchRegistered) {
              return `{result=${currentBatchRegistered.name}:${path}}`;
            }
            const lastBatchRegistered = this._resultCache.get(requestKey);
            if (lastBatchRegistered) {
              return getObjectValueByPath(lastBatchRegistered.body, path);
            }
            return null;
          }
        );
      }

      request.omit_response_on_success = false;

      // to keep the order of requests with the same key
      if (key) {
        let count = sendingKeysCounts.get(key);
        if (count !== undefined) {
          request.depends_on = makeRequestName(key, count);
          count += 1;
        } else {
          count = 1;
        }

        sendingKeysCounts.set(key, count);
        request.name = makeRequestName(key, count);
      }

      // register to use/cache the result
      if (registerResult) {
        if (!request.name) {
          request.name = makeRequestName('#request', i);
        }
        resultRegistry.set(registerResult, { name: request.name, idx: i });
      }

      // if binary data attached, use from-data and add the file field
      if (fileData !== undefined) {
        if (filesForm === undefined) {
          filesForm = new FormData();
        }

        const filename = makeFileName(fileCount);
        fileCount += 1;

        filesForm.append(filename, fileData, fileInfo);
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
        ? appendFormFields(filesForm, batchBody)
        : JSON.stringify(batchBody);

    const apiRes = await fetch(this._graphApiEntry, {
      method: POST,
      headers: filesForm !== undefined ? undefined : REQEST_JSON_HEADERS,
      body,
    });

    // if batch respond with error, throw it
    const apiBody = await apiRes.json();
    if (!apiRes.ok) {
      throw new GraphAPIError(apiBody);
    }

    // cache result if it's registered in this batch but not consumed
    this._resultCache.clear();
    for (const [consummingKey, { idx }] of resultRegistry.entries()) {
      this._resultCache.set(consummingKey, apiBody[idx]);
    }

    // collect batch results
    const jobResponses: JobResponse<MetaApiJob, MetaApiResult>[] = new Array(
      apiBody.length
    );

    for (let i = 0; i < jobResponses.length; i += 1) {
      const result = apiBody[i];
      result.body = JSON.parse(result.body);

      const success = result.code >= 200 && result.code < 300;

      jobResponses[i] = success
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

export default MetaApiWorker;
