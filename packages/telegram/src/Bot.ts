import invariant from 'invariant';
import fetch from 'node-fetch';
import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Engine, { DispatchError } from '@machinat/core/engine';
import ModuleUtilitiesI from '@machinat/core/base/ModuleUtilities';
import { makeClassProvider } from '@machinat/core/service';

import { createChatJob, createDirectInstanceJobs } from './job';
import generalElementDelegate from './components/general';
import TelegramWorker from './Worker';
import TelegramChat from './Chat';
import TelegramChatTarget from './ChatTarget';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TELEGRAM } from './constant';
import TelegramApiError from './Error';
import type {
  TelegramSegmentValue,
  TelegramJob,
  TelegramResult,
  BotApiResult,
  TelegramDispatchFrame,
  TelegramDispatchResponse,
  UploadingFile,
  TelegramComponent,
} from './types';

type TelegramBotOptions = {
  token: string;
  maxConnections?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    TelegramJob,
    TelegramDispatchFrame,
    TelegramResult
  >;
};

/**
 * @category Provider
 */
export class TelegramBot
  implements
    MachinatBot<TelegramChat | TelegramChatTarget, TelegramJob, TelegramResult>
{
  token: string;
  id: number;
  engine: Engine<
    TelegramChat | TelegramChatTarget,
    TelegramSegmentValue,
    TelegramComponent<unknown>,
    TelegramJob,
    TelegramResult
  >;

  constructor({
    token,
    maxConnections = 100,
    initScope,
    dispatchWrapper,
  }: TelegramBotOptions) {
    invariant(token, 'options.token should not be empty');

    this.token = token;
    this.id = Number(token.split(':', 1)[0]);

    const queue = new Queue<TelegramJob, TelegramResult>();
    const worker = new TelegramWorker(token, maxConnections);
    const renderer = new Renderer<
      TelegramSegmentValue,
      TelegramComponent<unknown>
    >(TELEGRAM, generalElementDelegate);

    this.engine = new Engine(
      TELEGRAM,
      renderer,
      queue,
      worker,
      initScope,
      dispatchWrapper
    );
  }

  async start(): Promise<void> {
    this.engine.start();
  }

  async stop(): Promise<void> {
    this.engine.stop();
  }

  render(
    target: number | string | TelegramChat | TelegramChatTarget,
    message: MachinatNode
  ): Promise<null | TelegramDispatchResponse> {
    const channel =
      target instanceof TelegramChat || target instanceof TelegramChatTarget
        ? target
        : new TelegramChatTarget(this.id, target);

    return this.engine.render(channel, message, createChatJob);
  }

  /**
   * Render specific instance directly without target chat, only allow
   * {@link AnswerCallbackQuery}, {@link AnswerInlineQuery},
   * {@link AnswerShippingQuery}, {@link AnswerPreCheckoutQuery} and editing
   * inline mode messages (using {@link EditText}, {@link EditCaption} and
   * {@link EditMedia} with inlineMessageId prop).
   */
  renderInstance(
    message: MachinatNode
  ): Promise<null | TelegramDispatchResponse> {
    return this.engine.render(null, message, createDirectInstanceJobs);
  }

  async fetchFile(fileId: string): Promise<null | {
    content: NodeJS.ReadableStream;
    contentType?: string;
    contentLength?: number;
  }> {
    const { file_path: filePath } = await this.makeApiCall('getFile', {
      file_id: fileId,
    });

    if (!filePath) {
      return null;
    }

    const fetchResponse = await fetch(
      `https://api.telegram.org/file/bot${this.token}/${filePath}`
    );

    if (!fetchResponse.ok) {
      throw new TelegramApiError({
        ok: false,
        description: fetchResponse.statusText,
        error_code: fetchResponse.status,
      });
    }

    const contentLength = fetchResponse.headers.get('content-length');
    return {
      content: fetchResponse.body,
      contentType: fetchResponse.headers.get('content-type') || undefined,
      contentLength: contentLength ? Number(contentLength) : undefined,
    };
  }

  async makeApiCall<Result extends BotApiResult>(
    method: string,
    parameters: Record<string, unknown> = {},
    uploadingFiles?: UploadingFile[]
  ): Promise<Result> {
    try {
      const response = await this.engine.dispatchJobs(null, [
        {
          method,
          parameters,
          executionKey: undefined,
          uploadingFiles: uploadingFiles || null,
        },
      ]);

      return response.results[0].result as Result;
    } catch (err) {
      if (err instanceof DispatchError) {
        throw err.errors[0];
      }
      throw err;
    }
  }
}

const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: ({ botToken, maxConnections }, moduleUtils, platformUtils) => {
    invariant(botToken, 'configs.botToken should not be empty');

    return new TelegramBot({
      token: botToken,
      maxConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    });
  },
})(TelegramBot);

type BotP = TelegramBot;
export default BotP;
