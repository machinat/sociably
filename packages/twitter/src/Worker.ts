import { createHmac } from 'crypto';
import { URL } from 'url';
import fetch, { Response } from 'node-fetch';
import FormData from 'form-data';
import _BigIntJSON from 'json-bigint';
import { nanoid } from 'nanoid';
import type { SociablyWorker } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import TwitterApiError from './Error';
import type {
  TwitterThread,
  TwitterJob,
  TwitterApiResult,
  MediaUploadResult,
  MediaSource,
} from './types';

type TwitterJobQueue = Queue<TwitterJob, TwitterApiResult>;

type TwitterWorkerOptions = {
  appKey: string;
  appSecret: string;
  bearerToken: string;
  accessToken: string;
  accessSecret: string;
  maxConnections: number;
};

type OauthOptions = {
  asApplication?: boolean;
  asUser?: {
    token: string;
    secret: string;
  };
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

  private _started: boolean;
  private _lockedKeys: Set<string>;
  private _targetCache: Map<string, TwitterThread>;

  constructor(options: TwitterWorkerOptions) {
    this.options = options;
    this.connectionCount = 0;

    this._lockedKeys = new Set();
    this._targetCache = new Map();
    this._started = false;
  }

  async requestApi(
    method: string,
    href: string,
    parameters?: Record<string, any>,
    oauth?: OauthOptions
  ): Promise<{ code: number; body: unknown }> {
    const apiUrl = new URL(href, API_ENTRY);
    const apiLocation = `${apiUrl.origin}${apiUrl.pathname}`;
    let body: undefined | string;

    if (method === 'GET') {
      if (parameters) {
        Object.entries(parameters).forEach(([k, v]) => {
          apiUrl.searchParams.set(k, v as string);
        });
      }
    } else if (parameters) {
      body = JSON.stringify(parameters);
    }
    const authHeader = this.getAuthHeader(
      method,
      apiLocation,
      Object.fromEntries(apiUrl.searchParams.entries()),
      oauth
    );

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

  async uploadMediaSources(mediaSources: MediaSource[]): Promise<{
    mediaIds: string[];
    uploadedMedia: TwitterApiResult['uploadedMedia'];
  }> {
    const mediaResults = await Promise.all(
      mediaSources.map((source) => {
        if (source.type === 'id') {
          return source.id;
        }
        if (source.type === 'file') {
          const { parameters, fileData } = source;
          return this.uploadMediaFile(fileData, parameters, {
            contentType: parameters.media_type as string | undefined,
            knownLength: parameters.total_bytes as number | undefined,
          });
        }
        if (source.type === 'url') {
          const { url, parameters } = source;
          return this.uploadMediaUrl(url, parameters);
        }
        throw new Error(`unknown media source ${(source as any).type}`);
      })
    );

    const mediaIds = mediaResults.map((mediaResult) =>
      typeof mediaResult === 'string'
        ? mediaResult
        : mediaResult.media_id_string
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
    url: string,
    parameters: Record<string, undefined | string | number>
  ): Promise<MediaUploadResult> {
    const downloadRes = await fetch(url);
    if (!downloadRes.ok) {
      throw new Error(
        `fail to download file at ${url} (${downloadRes.status} ${downloadRes.statusText})`
      );
    }

    const contentType = downloadRes.headers.get('Content-Type');
    const contentLength = downloadRes.headers.get('Content-Length');

    const updatedParameters = {
      ...parameters,
      media_type: parameters.media_type || contentType || undefined,
      total_bytes: parameters.total_bytes || contentLength || undefined,
    };

    const uploadResult = await this.uploadMediaFile(
      downloadRes.body,
      updatedParameters,
      {
        contentType: contentType || undefined,
        knownLength: contentLength ? Number(contentLength) : undefined,
      }
    );
    return uploadResult;
  }

  async uploadMediaFile(
    fileData: Buffer | NodeJS.ReadableStream,
    parameters: Record<string, undefined | string | number>,
    contentOptions: FormData.AppendOptions
  ): Promise<MediaUploadResult> {
    const initForm = new FormData();
    initForm.append('command', 'INIT');
    Object.entries(parameters).forEach(([filed, value]) => {
      if (value) {
        initForm.append(filed, value);
      }
    });
    const initResult = await this._requestUpload(initForm);

    const { media_id_string: mediaId } = initResult;
    const appendForm = new FormData();
    appendForm.append('command', 'APPEND');
    appendForm.append('media_id', mediaId);
    appendForm.append('media', fileData, contentOptions);
    appendForm.append('segment_index', 0);

    await this._requestUpload(appendForm);

    const finalizeForm = new FormData();
    finalizeForm.append('command', 'FINALIZE');
    finalizeForm.append('media_id', mediaId);

    const fnializeResult = await this._requestUpload(finalizeForm);
    return fnializeResult;
  }

  private async _requestUpload(form: FormData) {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        Authorization: this.getAuthHeader('POST', UPLOAD_URL),
      },
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

  getAuthHeader(
    method: string,
    baseUrl: string,
    additionalParams?: null | Record<string, string>,
    { asApplication, asUser }: OauthOptions = {}
  ): string {
    if (asApplication) {
      return `Bearer ${(this, this.options.bearerToken)}`;
    }

    const oauthParams = {
      oauth_consumer_key: this.options.appKey,
      oauth_nonce: nanoid(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_token: asUser?.token || this.options.accessToken,
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
        asUser?.secret || this.options.accessSecret
      )}`
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

      const { key: executeKey } = queue.peekAt(i) as TwitterJob;
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
    executeKey: undefined | string
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

    const mediaResults = mediaSources
      ? await this.uploadMediaSources(mediaSources)
      : null;

    const { method, href, parameters } = accomplishRequest
      ? accomplishRequest(
          currentTarget,
          request,
          mediaResults?.mediaIds || null
        )
      : request;

    const { code, body } = await this.requestApi(method, href, parameters, {
      asApplication,
    });

    if (key) {
      const nextTarget = refreshTarget && refreshTarget(currentTarget, body);
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
