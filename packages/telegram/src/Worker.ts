import fetch, { Response } from 'node-fetch';
import FormData from 'form-data';
import type { MachinatWorker } from '@machinat/core/engine';
import Queue from '@machinat/core/queue';
import type { TelegramJob, TelegramResult, UploadingFile } from './types';
import TelegramApiError from './Error';

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
    parameters: { [k: string]: any },
    uploadingFiles: null | UploadingFile[]
  ): Promise<TelegramResult> {
    let response: Response;

    if (uploadingFiles) {
      const form = new FormData();
      Object.entries(parameters).forEach(([key, value]) => {
        form.append(key, JSON.stringify(value));
      });

      uploadingFiles.forEach(({ fieldName, fileData, fileInfo }) => {
        form.append(fieldName, fileData, fileInfo);
      });

      response = await fetch(`${this.apiEntry}/${method}`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });
    } else {
      response = await fetch(`${this.apiEntry}/${method}`, {
        method: 'POST',
        body: JSON.stringify(parameters),
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

      const { key } = queue.peekAt(i) as TelegramJob;
      if (key !== undefined && lockedIds.has(key)) {
        i += 1;
      } else {
        this._consumeJobAt(queue, i, key);

        this.connectionCount += 1;

        if (key !== undefined) {
          lockedIds.add(key);
        }
      }
    }
  }

  private async _consumeJobAt(
    queue: Queue<TelegramJob, TelegramResult>,
    idx: number,
    executionKey: undefined | string
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
