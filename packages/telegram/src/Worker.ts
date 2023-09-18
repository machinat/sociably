import fetch, { Response } from 'node-fetch';
import FormStream from 'formstream';
import type { SociablyWorker } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import TelegramUser from './User.js';
import { AgentSettingsAccessorI } from './interface.js';
import TelegramApiError from './Error.js';
import type {
  TelegramJob,
  TelegramResult,
  UploadingFileInfo,
  FailApiResult,
} from './types.js';

type TelegramJobQueue = Queue<TelegramJob, TelegramResult>;

const API_HOST = 'https://api.telegram.org';

const makeBotApiEntry = (botToken: string) => `${API_HOST}/bot${botToken}`;

const requestBotApi = async (
  botToken: string,
  method: string,
  parameters: Record<string, unknown>,
  files: undefined | UploadingFileInfo[],
): Promise<TelegramResult> => {
  const botApiEntry = makeBotApiEntry(botToken);
  let response: Response;

  if (files && files.length > 0) {
    const form = FormStream();
    Object.entries(parameters).forEach(([key, value]) => {
      form.field(key, JSON.stringify(value));
    });

    files.forEach(({ fieldName, source }) => {
      if (typeof source.data === 'string' || Buffer.isBuffer(source.data)) {
        form.buffer(
          fieldName,
          Buffer.from(source.data),
          source.fileName as string,
          source.contentType,
        );
      } else {
        form.stream(
          fieldName,
          source.data,
          source.fileName as string,
          source.contentType,
          source.contentLength,
        );
      }
    });

    response = await fetch(`${botApiEntry}/${method}`, {
      method: 'POST',
      headers: form.headers(),
      body: form as unknown as NodeJS.ReadableStream,
    });
  } else {
    response = await fetch(`${botApiEntry}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters),
    });
  }

  const result = (await response.json()) as TelegramResult | FailApiResult;
  if (!result.ok) {
    throw new TelegramApiError(result);
  }

  return result;
};

export default class TelegramWorker
  implements SociablyWorker<TelegramJob, TelegramResult>
{
  private _settingsAccessor: AgentSettingsAccessorI;
  private _started: boolean;
  private _lockedKeys: Set<string>;

  connectionCount: number;
  maxConnections: number;

  constructor(
    settingsAccessor: AgentSettingsAccessorI,
    maxConnections: number,
  ) {
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

      const { key } = queue.peekAt(i)!;
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
    executionKey: undefined | string,
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
    const agentSettings = await this._settingsAccessor.getAgentSettings(
      new TelegramUser(agentId, true),
    );
    if (!agentSettings) {
      throw new Error(`Agent bot "${agentId}" not registered`);
    }

    const result = await requestBotApi(
      agentSettings.botToken,
      method,
      params,
      files,
    );

    return [{ success: true as const, result, job, error: undefined }];
  }
}
