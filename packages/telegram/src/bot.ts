import invariant from 'invariant';
import fetch from 'node-fetch';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Engine, { DispatchError } from '@machinat/core/engine';
import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core/types';
import { makeClassProvider, createEmptyScope } from '@machinat/core/service';

import { createChatJob, createDirectInstanceJobs } from './job';
import generalElementDelegate from './components/general';
import TelegramWorker from './worker';
import { TelegramChat, TelegramChatTarget } from './channel';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { TELEGRAM } from './constant';
import TelegramApiError from './error';
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
};

/**
 * @category Provider
 */
export class TelegramBot
  implements
    MachinatBot<
      TelegramChat | TelegramChatTarget,
      TelegramJob,
      TelegramResult
    > {
  token: string;
  id: number;
  engine: Engine<
    TelegramChat | TelegramChatTarget,
    TelegramSegmentValue,
    TelegramComponent<unknown>,
    TelegramJob,
    TelegramResult,
    TelegramBot
  >;

  constructor(
    options: TelegramBotOptions,
    initScope: InitScopeFn = () => createEmptyScope(TELEGRAM),
    dispatchWrapper: DispatchWrapper<
      TelegramJob,
      TelegramDispatchFrame,
      TelegramResult
    > = (dispatch) => dispatch
  ) {
    invariant(options?.token, 'options.token should not be empty');

    const { token, maxConnections = 100 } = options;

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
      this,
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

  async fetchFile(
    fileId: string
  ): Promise<null | {
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

export const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    PLATFORM_CONFIGS_I,
    { require: PLATFORM_MOUNTER_I, optional: true },
  ] as const,
  factory: ({ botToken, maxConnections }, mounter) => {
    invariant(botToken, 'configs.botToken should not be empty');

    return new TelegramBot(
      { token: botToken, maxConnections },
      mounter?.initScope,
      mounter?.dispatchWrapper
    );
  },
})(TelegramBot);

export type BotP = TelegramBot;
