import fetch, { Response } from 'node-fetch';
import FormData from 'form-data';
import type { SociablyWorker } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import TelegramUser from './User';
import { BotSettingsAccessorI } from './interface';
import type { TelegramJob, TelegramResult, UploadingFile } from './types';
import TelegramApiError from './Error';

type TelegramJobQueue = Queue<TelegramJob, TelegramResult>;

const API_HOST = 'https://api.telegram.org';

const makeBotApiEntry = (botToken: string) => `${API_HOST}/bot${botToken}`;

const requestBotApi = async (
  botToken: string,
  method: string,
  parameters: { [k: string]: unknown },
  files: undefined | UploadingFile[]
): Promise<TelegramResult> => {
  const botApiEntry = makeBotApiEntry(botToken);
  let response: Response;

  if (files && files.length > 0) {
    const form = new FormData();
    Object.entries(parameters).forEach(([key, value]) => {
      form.append(key, JSON.stringify(value));
    });

    files.forEach(({ fieldName, data, info: fileInfo }) => {
      form.append(fieldName, data, fileInfo);
    });

    response = await fetch(`${botApiEntry}/${method}`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
  } else {
    response = await fetch(`${botApiEntry}/${method}`, {
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
};

export default class TelegramWorker
  implements SociablyWorker<TelegramJob, TelegramResult>
{
  private _settingsAccessor: BotSettingsAccessorI;
  private _started: boolean;
  private _lockedKeys: Set<string>;

  connectionCount: number;
  maxConnections: number;

  constructor(settingsAccessor: BotSettingsAccessorI, maxConnections: number) {
    this._settingsAccessor = settingsAccessor;
    this.connectionCount = 0;
    this.maxConnections = maxConnections;
    this._lockedKeys = new Set();
    this._started = false;
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
    } catch {
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

  private _executeJobCallback: typeof this._executeJob =
    this._executeJob.bind(this);

  private async _executeJob([job]: TelegramJob[]) {
    const { method, params, files, agentId } = job;
    const botSettings = await this._settingsAccessor.getChannelSettings(
      new TelegramUser(agentId, true)
    );
    if (!botSettings) {
      throw new Error(`Agent bot "${agentId}" not registered`);
    }

    const result = await requestBotApi(
      botSettings.botToken,
      method,
      params,
      files
    );

    return [{ success: true as const, result, job, error: undefined }];
  }
}
