import fetch from 'node-fetch';
import FormData from 'form-data';
import type { MachinatWorker } from '@machinat/core/engine';
import Queue from '@machinat/core/queue';
import type { TelegramJob, TelegramResult, UploadingFile } from './types';
import TelegramApiError from './error';

const API_HOST = 'https://api.telegram.org';

type TelegramJobQueue = Queue<TelegramJob, TelegramResult>;

export default class TelegramWorker
  implements MachinatWorker<TelegramJob, TelegramResult>
{
  private _started: boolean;
  private _lockedKeys: Set<string>;

  connectionCount: number;
  maxConnections: number;
  apiEntry: string;

  constructor(botToken: string, maxConnections: number) {
    this.connectionCount = 0;
    this.maxConnections = maxConnections;
    this.apiEntry = `${API_HOST}/bot${botToken}`;

    this._lockedKeys = new Set();
    this._started = false;
  }

  async _request(
    method: string,
    bodyObject: { [k: string]: any },
    uploadingFiles: null | UploadingFile[]
  ): Promise<TelegramResult> {
    let body;
    let headers;
    if (uploadingFiles) {
      headers = { 'Content-Type': 'multipart/form-data' };
      body = new FormData();

      Object.entries(bodyObject).forEach(([key, value]) => {
        body.append(key, JSON.stringify(value));
      });

      uploadingFiles.forEach(({ fieldName, fileData, fileInfo }) => {
        body.append(fieldName, fileData, fileInfo);
      });
    } else {
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify(bodyObject);
    }

    const response = await fetch(`${this.apiEntry}/${method}`, {
      method: 'POST',
      body,
      headers,
    });

    const result = await response.json();

    if (!result.ok) {
      throw new TelegramApiError(result);
    }

    return result;
  }

  get started(): boolean {
    return this._started;
  }

  start(queue: TelegramJobQueue): boolean {
    if (this._started) {
      return false;
    }

    queue.onJobs(this._consumeCallback);
    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: TelegramJobQueue): boolean {
    if (!this._started) {
      return false;
    }

    this._started = false;
    queue.removeJobsListener(this._consumeCallback);
    return true;
  }

  private _consumeCallback = this._consume.bind(this);

  private _consume(queue: Queue<TelegramJob, TelegramResult>) {
    const { _lockedKeys: lockedIds, maxConnections } = this;

    for (let i = 0; i < queue.length; ) {
      if (this.connectionCount >= maxConnections) {
        break;
      }

      const { executionKey } = queue.peekAt(i) as TelegramJob;
      if (executionKey !== undefined && lockedIds.has(executionKey)) {
        i += 1;
      } else {
        this._consumeJobAt(queue, i, executionKey);

        this.connectionCount += 1;

        if (executionKey !== undefined) {
          lockedIds.add(executionKey);
        }
      }
    }
  }

  private async _consumeJobAt(
    queue: Queue<TelegramJob, TelegramResult>,
    idx: number,
    executionKey: void | string
  ) {
    try {
      await queue.acquireAt(idx, 1, this._executeJobCallback);
    } catch (e) {
      // NOTE: leave the error to the request side
    } finally {
      this.connectionCount -= 1;

      if (executionKey !== undefined) {
        this._lockedKeys.delete(executionKey);
      }

      if (this._started) {
        this._consume(queue);
      }
    }
  }

  private _executeJobCallback = this._executeJob.bind(this);

  private async _executeJob([job]: TelegramJob[]) {
    const { method, parameters, uploadingFiles } = job;
    const result = await this._request(method, parameters, uploadingFiles);

    return [{ success: true, result, job, error: undefined }];
  }
}
