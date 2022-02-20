import { createHmac } from 'crypto';
import { URL } from 'url';
import fetch, { Response } from 'node-fetch';
import FormData from 'form-data';
import _BigIntJSON from 'json-bigint';
import { nanoid } from 'nanoid';
import type { MachinatWorker } from '@machinat/core/engine';
import Queue from '@machinat/core/queue';
import TwitterApiError from './Error';
import type {
  TwitterChannel,
  TwitterJob,
  TwitterApiRequest,
  TwitterApiResult,
  UploadingFileInfo,
  MediaUploadResult,
  MediaSource,
  LinkingMedia,
} from './types';

const BigIntJSON = _BigIntJSON({ useNativeBigInt: true });

type TwitterJobQueue = Queue<TwitterJob, TwitterApiResult>;

const UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';
const API_ENTRY = 'https://api.twitter.com';

type TwitterWorkerOptions = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
  maxConnections: number;
};

const handleApiResponse = async (response: Response) => {
  const resultStr = await response.text();
  const result = resultStr ? BigIntJSON.parse(resultStr) : null;

  if (!response.ok) {
    throw new TwitterApiError(response.status, result);
  }
  return result;
};

export default class TwitterWorker
  implements MachinatWorker<TwitterJob, TwitterApiResult>
{
  private _appKey: string;
  private _accessToken: string;
  private _signingKey: string;

  private _started: boolean;
  private _lockedKeys: Set<string>;
  private _targetCache: Map<string, TwitterChannel>;

  connectionCount: number;
  maxConnections: number;

  constructor({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
    maxConnections,
  }: TwitterWorkerOptions) {
    this._appKey = appKey;
    this._accessToken = accessToken;
    this._signingKey = `${encodeURIComponent(appSecret)}&${encodeURIComponent(
      accessSecret
    )}`;

    this.connectionCount = 0;
    this.maxConnections = maxConnections;

    this._lockedKeys = new Set();
    this._targetCache = new Map();
    this._started = false;
  }

  async _requestApi(
    target: null | TwitterChannel,
    request: TwitterApiRequest,
    accomplishRequest: TwitterJob['accomplishRequest'],
    mediaSources: null | MediaSource[]
  ): Promise<TwitterApiResult> {
    const mediaResults = mediaSources
      ? await this._handleMediaSources(mediaSources)
      : null;

    const { method, href, parameters } = accomplishRequest
      ? accomplishRequest(target, request, mediaResults?.mediaIds || null)
      : request;

    const apiUrl = new URL(href, API_ENTRY);
    const apiLocation = `${apiUrl.origin}${apiUrl.pathname}`;
    let authHeader: string;
    let body: undefined | string;

    if (method === 'GET') {
      authHeader = this.getAuthHeader(method, apiLocation, parameters);
      if (parameters) {
        Object.entries(parameters).forEach(([k, v]) => {
          apiUrl.searchParams.set(k, v as string);
        });
      }
    } else {
      authHeader = this.getAuthHeader(method, apiLocation);
      body = JSON.stringify(parameters);
    }

    const response = await fetch(apiUrl.href, {
      method,
      body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });
    const result = await handleApiResponse(response);
    return {
      code: response.status,
      body: result,
      uploadedMedia: mediaResults?.uploadedMedia || null,
    };
  }

  private async _handleMediaSources(mediaSources: MediaSource[]): Promise<{
    mediaIds: string[];
    uploadedMedia: TwitterApiResult['uploadedMedia'];
  }> {
    const mediaResults = await Promise.all(
      mediaSources.map((media) => {
        if (media.sourceType === 'id') {
          return media.id;
        }
        if (media.sourceType === 'file') {
          const { parameters, fileData, fileInfo } = media;
          return this._uploadMedia(parameters, fileData, fileInfo);
        }
        if (media.sourceType === 'url') {
          return this._uploadFromUrl(media);
        }
        throw new Error(`unknown media source ${(media as any).sourceType}`);
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
        const media = mediaSources[idx];
        uploadedMedia.push({
          type: media.type,
          result: uploadResult,
          assetTag:
            media && media.sourceType !== 'id' ? media.assetTag : undefined,
        });
      }
    });

    return {
      mediaIds,
      uploadedMedia: uploadedMedia.length === 0 ? null : uploadedMedia,
    };
  }

  private async _uploadFromUrl(media: LinkingMedia) {
    const { type: mediaType, url, parameters } = media;
    const downloadRes = await fetch(url);
    if (!downloadRes.ok) {
      throw new Error(
        `fail to download ${mediaType} at ${url} (${downloadRes.status} ${downloadRes.statusText})`
      );
    }

    const contentType = downloadRes.headers.get('Content-Type');
    const contentLength = downloadRes.headers.get('Content-Length');

    const fileInfo = {
      contentType: contentType || undefined,
      knownLength: contentLength ? Number(contentLength) : undefined,
    };
    const updatedParameters = {
      ...parameters,
      media_type: parameters.media_type || contentType,
      total_bytes: parameters.total_bytes || contentLength,
    };

    const uploadResult = await this._uploadMedia(
      updatedParameters,
      downloadRes.body,
      fileInfo
    );
    return uploadResult;
  }

  async _uploadMedia(
    parameters: { [k: string]: string },
    fileData: Buffer | NodeJS.ReadableStream,
    fileInfo?: UploadingFileInfo
  ): Promise<MediaUploadResult> {
    const initForm = new FormData();
    initForm.append('command', 'INIT');
    Object.entries(parameters).forEach(([filed, value]) => {
      initForm.append(filed, value);
    });
    const initResult = await this._requestUpload(initForm);

    const { media_id_string: mediaId } = initResult;
    const appendForm = new FormData();
    appendForm.append('command', 'APPEND');
    appendForm.append('media_id', mediaId);
    appendForm.append('media', fileData, fileInfo);
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

    const result = await handleApiResponse(response);
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
    additionalParams?: Record<string, string>
  ): string {
    const oauthParams = {
      oauth_consumer_key: this._appKey,
      oauth_nonce: nanoid(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_token: this._accessToken,
      oauth_version: '1.0',
    };
    const paramsToSign = { ...oauthParams, ...additionalParams };
    const paramsStr = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(paramsToSign[k])}`)
      .join('&');
    const baseStr = [
      method,
      encodeURIComponent(baseUrl),
      encodeURIComponent(paramsStr),
    ].join('&');
    const signature = createHmac('sha1', this._signingKey)
      .update(baseStr)
      .digest('base64');
    const header = `OAuth ${Object.entries(oauthParams)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')},oauth_signature="${encodeURIComponent(signature)}"`;
    return header;
  }

  private _consumeCallback = this._consume.bind(this);

  private _consume(queue: Queue<TwitterJob, TwitterApiResult>) {
    const { _lockedKeys: lockedKeys, maxConnections } = this;

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
    } = job;
    const currentTarget =
      (key && refreshTarget && this._targetCache.get(key)) || initialTarget;

    const result = await this._requestApi(
      currentTarget,
      request,
      accomplishRequest,
      mediaSources
    );

    if (key) {
      const nextTarget =
        refreshTarget && refreshTarget(currentTarget, result.body);
      if (nextTarget) {
        this._targetCache.set(key, nextTarget);
      } else if (currentTarget !== initialTarget) {
        this._targetCache.delete(key);
      }
    }

    return [{ success: true, result, job, error: undefined }];
  }
}
