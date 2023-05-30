import crypto from 'crypto';
import fetch from 'node-fetch';
import FormData from 'form-data';
import type { AgentSettingsAccessor, SociablyChannel } from '@sociably/core';
import type { SociablyWorker } from '@sociably/core/engine';
import SociablyQueue, { JobResponse } from '@sociably/core/queue';
import GraphAPIError from './Error.js';
import formatBatchRequest from './utils/formatBatchRequest.js';
import appendFormFields from './utils/appendFormFields.js';
import getObjectValueByPath from './utils/getObjectValueByPath.js';
import type {
  MetaApiJob,
  MetaApiResult,
  MetaBatchRequest,
  GraphApiErrorBody,
} from './types.js';

type MetaSendingSettings = {
  accessToken: string;
};
type MetaAgentSettingsAccessor = AgentSettingsAccessor<
  SociablyChannel,
  MetaSendingSettings
>;

type MetaApiQueue = SociablyQueue<MetaApiJob, MetaApiResult>;
type TimeoutID = ReturnType<typeof setTimeout>;

type MetaApiWorkerOptions = {
  agentSettingsAccessor?: MetaAgentSettingsAccessor;
  appId: string;
  appSecret: string;
  graphApiVersion: string;
  defaultAccessToken?: string;
  consumeInterval: number;
};

const POST = 'POST';
const REQEST_JSON_HEADERS = { 'Content-Type': 'application/json' };

const makeRequestName = (key: string, count: number) => `${key}-${count}`;
const makeFileName = (num: number) => `file_${num}`;

class MetaApiWorker implements SociablyWorker<MetaApiJob, MetaApiResult> {
  consumeInterval: number;
  defaultAccessToken?: string;
  private _agentSettingsAccessor: MetaAgentSettingsAccessor;
  private _appId: string;
  private _appSecret: string;
  private _graphApiEntry: string;

  private _started: boolean;
  // @ts-expect-error: keep for later use
  private _isConsuming: boolean;
  private _consumptionTimeoutId: TimeoutID | null;

  private _resultCache: Map<string, MetaApiResult>;

  constructor({
    agentSettingsAccessor,
    appId,
    appSecret,
    graphApiVersion,
    consumeInterval,
    defaultAccessToken,
  }: MetaApiWorkerOptions) {
    this.consumeInterval = consumeInterval;
    this.defaultAccessToken = defaultAccessToken;
    this._agentSettingsAccessor = agentSettingsAccessor || {
      getAgentSettings: async () => null,
      getAgentSettingsBatch: async () => [],
    };

    this._appId = appId;
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

    const settings = await this._agentSettingsAccessor.getAgentSettingsBatch(
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
      jobs
        .map((job) => job.channel)
        .filter((channel): channel is SociablyChannel => !!channel)
    );
    let rootAccessToken: string | undefined;

    for (let i = 0; i < jobs.length; i += 1) {
      const job = jobs[i];
      const {
        request: requestInput,
        key,
        file,
        registerResult,
        consumeResult,
        channel,
        accessToken: accessTokenInput,
      } = job;

      const accessToken = job.asApplication
        ? `${this._appId}|${this._appSecret}`
        : channel
        ? channelTokenMap.get(channel.uid) || this.defaultAccessToken
        : accessTokenInput || this.defaultAccessToken;
      if (!rootAccessToken) {
        rootAccessToken = accessToken;
      }

      if (!accessToken) {
        jobResponses[i] = {
          success: false,
          job,
          result: { code: 0, headers: {}, body: {} },
          error: new Error(
            `No access token available for ${
              channel ? `channel ${channel.uid}` : 'job'
            }`
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

    if (!rootAccessToken) {
      // no access token available for every job
      return jobResponses;
    }
    const batchBody = {
      access_token: rootAccessToken,
      appsecret_proof: this._createAppSecretProof(rootAccessToken),
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

    const apiBody = await apiRes.json();
    if (!apiRes.ok) {
      // unexpected batch API error, throw it
      throw new GraphAPIError(apiBody as GraphApiErrorBody);
    }

    const results = (
      apiBody as (Omit<MetaApiResult, 'body'> & { body: string })[]
    ).map(
      (result): MetaApiResult => ({
        ...result,
        body: JSON.parse(result.body),
      })
    );

    // cache result for the next batch
    this._resultCache.clear();
    for (const [consummingKey, { idx }] of resultRegistry.entries()) {
      this._resultCache.set(consummingKey, results[idx]);
    }

    // collect batch results
    for (let i = 0; i < jobResponses.length; i += 1) {
      if (!jobResponses[i]) {
        const result = results.shift();
        if (!result) {
          throw new Error('Batch API results count is unexpectedly unmatched');
        }

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
                error: new GraphAPIError(result.body as GraphApiErrorBody),
                job: jobs[i],
              };
      }
    }
    return jobResponses;
  }
}

export default MetaApiWorker;
