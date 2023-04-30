import fetch from 'node-fetch';
import type {
  SociablyNode,
  SociablyBot,
  InitScopeFn,
  DispatchWrapper,
} from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import Queue from '@sociably/core/queue';
import Engine, { DispatchError } from '@sociably/core/engine';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import { makeClassProvider } from '@sociably/core/service';
import { createChatJob, createBotScopeJobs } from './job';
import generalElementDelegate from './components/general';
import TelegramWorker from './Worker';
import TelegramChat from './Chat';
import TelegramUser from './User';
import {
  ConfigsI,
  PlatformUtilitiesI,
  BotSettingsAccessorI,
} from './interface';
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
  botSettingsAccessor: BotSettingsAccessorI;
  maxRequestConnections?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    TelegramJob,
    TelegramDispatchFrame,
    TelegramResult
  >;
};

type ApiCallOptions = {
  bot: TelegramUser;
  method: string;
  params?: Record<string, unknown>;
  uploadFiles?: UploadingFile[];
};

/**
 * @category Provider
 */
export class TelegramBot
  implements SociablyBot<TelegramChat, TelegramJob, TelegramResult>
{
  botSettingsAccessor: BotSettingsAccessorI;
  engine: Engine<
    TelegramUser | TelegramChat,
    TelegramSegmentValue,
    TelegramComponent<unknown>,
    TelegramJob,
    TelegramResult
  >;

  platform = TELEGRAM;

  constructor({
    botSettingsAccessor,
    maxRequestConnections = 100,
    initScope,
    dispatchWrapper,
  }: TelegramBotOptions) {
    const queue = new Queue<TelegramJob, TelegramResult>();
    const worker = new TelegramWorker(
      botSettingsAccessor,
      maxRequestConnections
    );
    const renderer = new Renderer<
      TelegramSegmentValue,
      TelegramComponent<unknown>
    >(TELEGRAM, generalElementDelegate);

    this.botSettingsAccessor = botSettingsAccessor;
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

  /**
   * Render UI on a Telegram chat. If chat target is `null`, only accept
   * {@link AnswerCallbackQuery}, {@link AnswerInlineQuery},
   * {@link AnswerShippingQuery}, {@link AnswerPreCheckoutQuery} and editing
   * inline mode messages (using {@link EditText}, {@link EditCaption} and
   * {@link EditMedia} with inlineMessageId prop).
   */
  render(
    target: TelegramUser | TelegramChat,
    message: SociablyNode
  ): Promise<null | TelegramDispatchResponse> {
    if (target instanceof TelegramUser) {
      return this.engine.render(target, message, createBotScopeJobs);
    }

    return this.engine.render(target, message, createChatJob);
  }

  async fetchFile(
    bot: TelegramUser,
    fileId: string
  ): Promise<null | {
    content: NodeJS.ReadableStream;
    contentType?: string;
    contentLength?: number;
  }> {
    const botSettings = await this.botSettingsAccessor.getChannelSettings(bot);
    if (!botSettings) {
      throw new Error(`Bot ${bot.id} not found`);
    }

    const { file_path: filePath } = await this.makeApiCall({
      bot,
      method: 'getFile',
      params: { file_id: fileId },
    });

    if (!filePath) {
      return null;
    }

    const fetchResponse = await fetch(
      `https://api.telegram.org/file/bot${botSettings.botToken}/${filePath}`
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

  async makeApiCall<Result extends BotApiResult>({
    bot,
    method,
    params = {},
    uploadFiles,
  }: ApiCallOptions): Promise<Result> {
    try {
      const response = await this.engine.dispatchJobs(bot, [
        {
          botId: bot.id,
          method,
          params,
          key: undefined,
          uploadFiles: uploadFiles || null,
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
    BotSettingsAccessorI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    { maxRequestConnections },
    botSettingsAccessor,
    moduleUtils,
    platformUtils
  ) => {
    return new TelegramBot({
      botSettingsAccessor,
      maxRequestConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    });
  },
})(TelegramBot);

type BotP = TelegramBot;
export default BotP;
