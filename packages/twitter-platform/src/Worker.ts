import { createHmac } from 'crypto';
import { URL } from 'url';
import { Readable } from 'stream';
import fetch, { Response } from 'node-fetch';
import FormStream from 'formstream';
import _BigIntJSON from 'json-bigint';
import { nanoid } from 'nanoid';
import type { SociablyWorker } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import TwitterUser from './User.js';
import TwitterApiError from './Error.js';
import { AgentSettingsAccessorI } from './interface.js';
import type {
  TwitterThread,
  TwitterJob,
  TwitterApiResult,
  MediaUploadResult,
  MediaSource,
} from './types.js';

type TwitterJobQueue = Queue<TwitterJob, TwitterApiResult>;

type TwitterWorkerOptions = {
  appKey: string;
  appSecret: string;
  bearerToken: string;
  maxConnections: number;
};

const BigIntJSON = _BigIntJSON({ useNativeBigInt: true });
const UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';
const API_ENTRY = 'https://api.twitter.com';

const getResponseBody = async (response: Response) => {
  const resultStr = await response.text();
  const contentType = response.headers.get('content-type');
  const result = !resultStr
    ? null
    : typeof contentType === 'string' &&
      contentType.indexOf('application/json') !== -1
    ? BigIntJSON.parse(resultStr)
    : resultStr;

  if (!response.ok) {
    throw new TwitterApiError(response.status, result);
  }
  return result;
};

export default class TwitterWorker
  implements SociablyWorker<TwitterJob, TwitterApiResult>
{
  options: TwitterWorkerOptions;
  connectionCount: number;

  private _settingsAccessor: AgentSettingsAccessorI;
  private _started: boolean;
  private _lockedKeys: Set<string>;
  private _targetCache: Map<string, TwitterThread>;

  constructor(
    settingsAccessor: AgentSettingsAccessorI,
    options: TwitterWorkerOptions,
  ) {
    this._settingsAccessor = settingsAccessor;
    this.options = options;
    this.connectionCount = 0;

    this._lockedKeys = new Set();
    this._targetCache = new Map();
    this._started = false;
  }

  async requestApi(
    agent: null | TwitterUser,
    method: string,
    href: string,
    params: Record<string, unknown>,
    asApplication?: boolean,
    withUserOauth?: { token: string; secret: string },
  ): Promise<{ code: number; body: unknown }> {
    const apiUrl = new URL(href, API_ENTRY);
    const apiLocation = `${apiUrl.origin}${apiUrl.pathname}`;
    let body: undefined | string;

    if (method === 'GET' || method === 'DELETE') {
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          apiUrl.searchParams.set(k, v as string);
        });
      }
    } else if (params) {
      body = JSON.stringify(params);
    }

    let authHeader: string;
    if (asApplication) {
      authHeader = `Bearer ${(this, this.options.bearerToken)}`;
    } else {
      authHeader = await this.getUserOauthHeader(
        agent,
        method,
        apiLocation,
        Object.fromEntries(apiUrl.searchParams.entries()),
        withUserOauth,
      );
    }

    const response = await fetch(apiUrl.href, {
      method,
      body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });
    const result = await getResponseBody(response);
    return {
      code: response.status,
      body: result,
    };
  }

  async uploadMediaSources(
    agent: TwitterUser,
    mediaSources: MediaSource[],
  ): Promise<{
    mediaIds: string[];
    uploadedMedia: TwitterApiResult['uploadedMedia'];
  }> {
    const mediaResults = await Promise.all(
      mediaSources.map((source) => {
        if (source.type === 'id') {
          return source.id;
        }
        if (source.type === 'file') {
          const { params, file } = source;
          return this.uploadMediaFile(agent, params, file.data);
        }
        if (source.type === 'url') {
          const { url, params } = source;
          return this.uploadMediaUrl(agent, url, params);
        }
        throw new Error(
          `unknown media source ${(source as { type: string }).type}`,
        );
      }),
    );

    const mediaIds = mediaResults.map((mediaResult) =>
      typeof mediaResult === 'string'
        ? mediaResult
        : mediaResult.media_id_string,
    );

    const uploadedMedia: TwitterApiResult['uploadedMedia'] = [];
    mediaResults.forEach((uploadResult, idx) => {
      if (typeof uploadResult === 'object') {
        const source = mediaSources[idx];
        uploadedMedia.push({
          source,
          result: uploadResult,
          assetTag:
            source && source.type !== 'id' ? source.assetTag : undefined,
        });
      }
    });

    return {
      mediaIds,
      uploadedMedia: uploadedMedia.length === 0 ? null : uploadedMedia,
    };
  }

  async uploadMediaUrl(
    agent: TwitterUser,
    url: string,
    params: Record<string, unknown>,
  ): Promise<MediaUploadResult> {
    const downloadRes = await fetch(url);
    if (!downloadRes.ok) {
      throw new Error(
        `fail to download file at ${url} (${downloadRes.status} ${downloadRes.statusText})`,
      );
    }

    const contentType = downloadRes.headers.get('Content-Type');
    const contentLength = downloadRes.headers.get('Content-Length');

    const updatedParams = {
      ...params,
      media_type: params.media_type || contentType || undefined,
      total_bytes: params.total_bytes || contentLength || undefined,
    };

    const uploadResult = await this.uploadMediaFile(
      agent,
      updatedParams,
      downloadRes.body as Readable,
    );
    return uploadResult;
  }

  async uploadMediaFile(
    agent: TwitterUser,
    params: Record<string, unknown>,
    fileData: string | Buffer | Readable,
  ): Promise<MediaUploadResult> {
    const initForm = FormStream();
    initForm.field('command', 'INIT');
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        initForm.field(key, value as string);
      }
    });
    const initResult = await this.requestUploadApi(agent, initForm);

    const { media_id_string: mediaId } = initResult;
    const appendForm = FormStream();
    appendForm.field('command', 'APPEND');
    appendForm.field('media_id', mediaId);
    appendForm.field('segment_index', '0');
    if (typeof fileData === 'string' || Buffer.isBuffer(fileData)) {
      appendForm.buffer('media', Buffer.from(fileData), '');
    } else {
      appendForm.stream('media', fileData, '');
    }
    await this.requestUploadApi(agent, appendForm);

    const finalizeForm = FormStream();
    finalizeForm.field('command', 'FINALIZE');
    finalizeForm.field('media_id', mediaId);

    const fnializeResult = await this.requestUploadApi(agent, finalizeForm);
    return fnializeResult;
  }

  private async requestUploadApi(agent: TwitterUser, form: FormStream) {
    const authHeader = await this.getUserOauthHeader(agent, 'POST', UPLOAD_URL);

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        ...form.headers(),
        Authorization: authHeader,
      },
      body: form as unknown as NodeJS.ReadableStream,
    });

    const result = await getResponseBody(response);
    return result;
  }

  get started(): boolean {
    return this._started;
  }

  start(queue: TwitterJobQueue): boolean {
    if (this._started) {
      return false;
    }

    queue.onJobs(this._consumeCallback);
    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: TwitterJobQueue): boolean {
    if (!this._started) {
      return false;
    }

    this._started = false;
    queue.removeJobsListener(this._consumeCallback);
    return true;
  }

  async getUserOauthHeader(
    agent: null | TwitterUser,
    method: string,
    baseUrl: string,
    additionalParams?: null | Record<string, string>,
    withUserOauth?: { token: string; secret: string },
  ): Promise<string> {
    let accessToken: string;
    let tokenSecret: string;
    if (agent) {
      const agentSettings =
        await this._settingsAccessor.getAgentSettings(agent);
      if (!agentSettings) {
        throw new Error(`agent user "${agent.id}" not registered`);
      }
      ({ accessToken, tokenSecret } = agentSettings);
    } else if (withUserOauth) {
      accessToken = withUserOauth.token;
      tokenSecret = withUserOauth.secret;
    } else {
      throw new Error('no user token and secret provided');
    }

    const oauthParams = {
      oauth_consumer_key: this.options.appKey,
      oauth_nonce: nanoid(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_token: accessToken,
      oauth_version: '1.0',
    };

    const paramsToSign = { ...oauthParams, ...additionalParams };
    const paramsStr = Object.keys(paramsToSign)
      .sort()
      .map((k) => {
        const v = paramsToSign[k];
        return v ? `${k}=${encodeURIComponent(v)}` : undefined;
      })
      .filter((param) => !!param)
      .join('&');
    const baseStr = [
      method,
      encodeURIComponent(baseUrl),
      encodeURIComponent(paramsStr),
    ].join('&');
    const signature = createHmac(
      'sha1',
      `${encodeURIComponent(this.options.appSecret)}&${encodeURIComponent(
        tokenSecret,
      )}`,
    )
      .update(baseStr)
      .digest('base64');
    const header = `OAuth ${Object.entries(oauthParams)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')},oauth_signature="${encodeURIComponent(signature)}"`;
    return header;
  }

  private _consumeCallback = this._consume.bind(this);

  private _consume(queue: Queue<TwitterJob, TwitterApiResult>) {
    const {
      _lockedKeys: lockedKeys,
      options: { maxConnections },
    } = this;

    for (let i = 0; i < queue.length; ) {
      if (this.connectionCount >= maxConnections) {
        break;
      }

      const { key: executeKey } = queue.peekAt(i)!;
      if (executeKey !== undefined && lockedKeys.has(executeKey)) {
        i += 1;
      } else {
        this._consumeJobAt(queue, i, executeKey);

        this.connectionCount += 1;

        if (executeKey !== undefined) {
          lockedKeys.add(executeKey);
        }
      }
    }
  }

  private async _consumeJobAt(
    queue: Queue<TwitterJob, TwitterApiResult>,
    idx: number,
    executeKey: undefined | string,
  ) {
    try {
      await queue.acquireAt(idx, 1, this._executeJobCallback);
    } catch (e) {
      // NOTE: leave the error to the request side
    } finally {
      this.connectionCount -= 1;

      if (executeKey !== undefined) {
        this._lockedKeys.delete(executeKey);
      }

      if (this._started) {
        this._consume(queue);
      }
    }
  }

  private _executeJobCallback = this._executeJob.bind(this);

  private async _executeJob([job]: TwitterJob[]) {
    const {
      target: initialTarget,
      key,
      refreshTarget,
      request,
      accomplishRequest,
      mediaSources,
      asApplication,
    } = job;
    const currentTarget =
      (key && refreshTarget && this._targetCache.get(key)) || initialTarget;
    const agent = initialTarget?.agent || null;

    const mediaResults =
      agent && mediaSources
        ? await this.uploadMediaSources(agent, mediaSources)
        : null;

    const { method, url, params } =
      currentTarget && accomplishRequest
        ? accomplishRequest(
            currentTarget,
            request,
            mediaResults?.mediaIds || null,
          )
        : request;

    const { code, body } = await this.requestApi(
      agent,
      method,
      url,
      params,
      asApplication,
    );

    if (key) {
      const nextTarget = currentTarget && refreshTarget?.(currentTarget, body);
      if (nextTarget) {
        this._targetCache.set(key, nextTarget);
      } else if (currentTarget !== initialTarget) {
        this._targetCache.delete(key);
      }
    }

    return [
      {
        success: true,
        result: {
          code,
          body,
          uploadedMedia: mediaResults?.uploadedMedia || null,
        },
        job,
        error: undefined,
      },
    ];
  }
}
