import { URL } from 'url';
import fetch from 'node-fetch';
import { SociablyWorker } from '@sociably/core/engine';
import Queue, { JobResponse } from '@sociably/core/queue';
import { AgentSettingsAccessorI } from './interface';
import { LineJob, LineResult } from './types';
import LineChannel from './Channel';
import LineApiError from './error';

const API_HOST = 'https://api.line.me';

type LineJobQueue = Queue<LineJob, LineResult>;

const request = async (
  method: string,
  apiUrl: string,
  params: unknown | null,
  accessToken?: string
): Promise<LineResult> => {
  const requestUrl = new URL(apiUrl, API_HOST);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const isNoBodyMethod = method === 'GET' || method === 'DELETE';
  if (params && isNoBodyMethod) {
    Object.entries(params).forEach(([key, value]) => {
      requestUrl.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(requestUrl.href, {
    method,
    headers,
    body: params && !isNoBodyMethod ? JSON.stringify(params) : undefined,
  });

  let resBody;
  // catch parsing error, body can be empty string in some api
  try {
    resBody = await response.json();
  } catch (e) {
    // catch some line api respond empty string
    if (e.message.indexOf('Unexpected end of JSON input') === -1) {
      throw e;
    }
    resBody = {};
  }

  const result = {
    code: response.status,
    headers: Object.fromEntries(response.headers),
    body: resBody,
  };

  if (!response.ok) {
    throw new LineApiError(result);
  }

  return result;
};

class LineWorker implements SociablyWorker<LineJob, LineResult> {
  connectionCount: number;
  maxConnections: number;

  private _settingsAccessor: AgentSettingsAccessorI;
  private _started: boolean;
  private _lockedKeys: Set<string>;

  constructor(
    settingsAccessor: AgentSettingsAccessorI,
    maxConnections: number
  ) {
    this.connectionCount = 0;
    this.maxConnections = maxConnections;
    this._settingsAccessor = settingsAccessor;
    this._lockedKeys = new Set();
    this._started = false;
  }

  get started(): boolean {
    return this._started;
  }

  start(queue: LineJobQueue): boolean {
    if (this._started) {
      return false;
    }

    queue.onJobs(this._consumeCallback);
    this._started = true;

    this._consume(queue);
    return true;
  }

  stop(queue: LineJobQueue): boolean {
    if (!this._started) {
      return false;
    }

    this._started = false;
    queue.removeJobsListener(this._consumeCallback);
    return true;
  }

  private _consumeCallback = this._consume.bind(this);

  private _consume(queue: Queue<LineJob, LineResult>) {
    const { _lockedKeys: lockedIds, maxConnections } = this;

    for (let i = 0; i < queue.length; ) {
      if (this.connectionCount >= maxConnections) {
        break;
      }

      const { key: executionKey } = queue.peekAt(i) as LineJob;
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
    queue: Queue<LineJob, LineResult>,
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

  private _executeJobCallback: typeof this._executeJob =
    this._executeJob.bind(this);

  private async _executeJob([job]: LineJob[]): Promise<
    JobResponse<LineJob, LineResult>[]
  > {
    const { method, url, params, chatChannelId, accessToken } = job;
    let accessTokenToUse = accessToken;

    if (!accessTokenToUse && chatChannelId) {
      const settings = await this._settingsAccessor.getAgentSettings(
        new LineChannel(chatChannelId)
      );
      if (!settings) {
        throw new Error(`Channel "${chatChannelId}" settings not found`);
      }

      accessTokenToUse = settings.accessToken;
    }

    const result = await request(method, url, params, accessTokenToUse);
    return [{ success: true, result, job, error: undefined }];
  }
}

export default LineWorker;
