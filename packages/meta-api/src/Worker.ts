import crypto from 'crypto';
import fetch from 'node-fetch';
import FormData from 'form-data';
import type { ChannelSettingsAccessor, SociablyChannel } from '@sociably/core';
import type { SociablyWorker } from '@sociably/core/engine';
import SociablyQueue, { JobResponse } from '@sociably/core/queue';
import GraphAPIError from './Error';
import formatBatchRequest from './utils/formatBatchRequest';
import appendFormFields from './utils/appendFormFields';
import getObjectValueByPath from './utils/getObjectValueByPath';
import type { MetaApiJob, MetaApiResult, MetaBatchRequest } from './types';

type MetaSendingSettings = {
  accessToken: string;
};
type MetaSettingsAccessor = ChannelSettingsAccessor<
  SociablyChannel,
  MetaSendingSettings
>;

type MetaApiQueue = SociablyQueue<MetaApiJob, MetaApiResult>;
type TimeoutID = ReturnType<typeof setTimeout>;

const POST = 'POST';
const REQEST_JSON_HEADERS = { 'Content-Type': 'application/json' };

const makeRequestName = (key: string, count: number) => `${key}-${count}`;

const makeFileName = (num: number) => `file_${num}`;

class MetaApiWorker implements SociablyWorker<MetaApiJob, MetaApiResult> {
  consumeInterval: number;
  private _settingsAccessor: MetaSettingsAccessor;
  private _appSecret: undefined | string;
  private _graphApiEntry: string;

  private _started: boolean;
  // @ts-expect-error: keep for later use
  private _isConsuming: boolean;
  private _consumptionTimeoutId: TimeoutID | null;

  private _resultCache: Map<string, MetaApiResult>;

  constructor(
    settingsAccessor: MetaSettingsAccessor,
    appSecret: undefined | string,
    graphApiVersion: string,
    consumeInterval: number
  ) {
    this._settingsAccessor = settingsAccessor;
    this.consumeInterval = consumeInterval;

    this._appSecret = appSecret;
    this._graphApiEntry = `https://graph.facebook.com/${graphApiVersion}/`;

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

  private _createAppSecretProof(accessToken: string) {
    const appSecret = this._appSecret;
    return appSecret
      ? crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')
      : undefined;
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

  private async _getAccessTokensOfChannels(
    channels: SociablyChannel[]
  ): Promise<Map<string, string>> {
    const uniqChannelsMap = new Map(channels.map((chan) => [chan.uid, chan]));
    const uniqChannels = [...uniqChannelsMap.values()];

    const settings = await this._settingsAccessor.getChannelSettingsBatch(
      uniqChannels
    );
    return new Map(
      uniqChannels
        .map((chan, i) => [chan.uid, settings[i]?.accessToken])
        .filter((tokenPair): tokenPair is [string, string] => !!tokenPair[1])
    );
  }

  private _executeJobsCallback = this._executeJobs.bind(this);
  private async _executeJobs(jobs: MetaApiJob[]) {
    const sendingKeysCounts = new Map<string, number>();
    const resultRegistry = new Map<string, { name: string; idx: number }>();
    let fileCount = 0;
    let filesForm: undefined | FormData;

    const jobResponses: JobResponse<MetaApiJob, MetaApiResult>[] = new Array(
      jobs.length
    );
    const batchRequests: MetaBatchRequest[] = [];

    const channelTokenMap = await this._getAccessTokensOfChannels(
      jobs.map((job) => job.channel)
    );

    for (let i = 0; i < jobs.length; i += 1) {
      const job = jobs[i];
      const {
        request: requestInput,
        key,
        file,
        registerResult,
        consumeResult,
        channel,
      } = job;

      const accessToken = channelTokenMap.get(channel.uid);
      if (!accessToken) {
        jobResponses[i] = {
          success: false,
          job,
          result: { code: 0, headers: {}, body: {} },
          error: new Error(
            `No access token available for channel ${channel.uid}`
          ),
        };
      } else {
        let request = requestInput;

        // if it requires previous results to accomplish the request
        if (consumeResult) {
          const { keys: consummingKeys, accomplishRequest } = consumeResult;

          const getPreviousResult = (requestKey, path) => {
            const currentBatchRegistered = resultRegistry.get(requestKey);
            if (currentBatchRegistered) {
              return `{result=${currentBatchRegistered.name}:${path}}`;
            }
            const lastBatchRegistered = this._resultCache.get(requestKey);
            if (lastBatchRegistered) {
              return getObjectValueByPath(lastBatchRegistered.body, path);
            }
            return null;
          };
          request = accomplishRequest(
            requestInput,
            consummingKeys,
            getPreviousResult
          );
        }

        const batchRequest = formatBatchRequest(request, accessToken);

        // to keep the order of requests with the same key
        if (key) {
          let count = sendingKeysCounts.get(key);
          if (count !== undefined) {
            batchRequest.depends_on = makeRequestName(key, count);
            count += 1;
          } else {
            count = 1;
          }

          sendingKeysCounts.set(key, count);
          batchRequest.name = makeRequestName(key, count);
        }

        // register to use/cache the result
        if (registerResult) {
          if (!batchRequest.name) {
            batchRequest.name = makeRequestName('#request', i);
          }
          resultRegistry.set(registerResult, {
            name: batchRequest.name,
            idx: i,
          });
        }

        // if binary data attached, use from-data and add the file field
        if (file) {
          if (filesForm === undefined) {
            filesForm = new FormData();
          }

          const filename = makeFileName(fileCount);
          fileCount += 1;

          filesForm.append(filename, file.data, file.info);
          batchRequest.attached_files = filename;
        }

        batchRequest.omit_response_on_success = false;
        batchRequests.push(batchRequest);
      }
    }

    const fallbackToken = channelTokenMap.values().next().value as string;
    const batchBody = {
      access_token: fallbackToken,
      appsecret_proof: this._createAppSecretProof(fallbackToken),
      batch: JSON.stringify(batchRequests),
    };

    // use formdata if files attached, otherwise JSON
    const body =
      filesForm !== undefined
        ? appendFormFields(filesForm, batchBody)
        : JSON.stringify(batchBody);

    const apiRes = await fetch(this._graphApiEntry, {
      method: POST,
      headers: filesForm !== undefined ? undefined : REQEST_JSON_HEADERS,
      body,
    });

    // unexpected batch API error, throw it
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
    const results = [...apiBody];
    for (let i = 0; i < jobResponses.length; i += 1) {
      if (!jobResponses[i]) {
        const result = results.shift();
        result.body = JSON.parse(result.body);

        jobResponses[i] =
          result.code >= 200 && result.code < 300
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
    }
    return jobResponses;
  }
}

export default MetaApiWorker;
