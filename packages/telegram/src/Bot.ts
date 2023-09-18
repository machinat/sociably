import { Readable } from 'stream';
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
import { serviceProviderClass } from '@sociably/core/service';
import { createChatJob, createBotScopeJobs } from './job.js';
import generalElementDelegate from './components/general.js';
import TelegramWorker from './Worker.js';
import TelegramChat from './Chat.js';
import TelegramUser from './User.js';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import { TELEGRAM } from './constant.js';
import TelegramApiError from './Error.js';
import type {
  TelegramSegmentValue,
  TelegramJob,
  TelegramResult,
  BotApiResult,
  TelegramDispatchFrame,
  TelegramDispatchResponse,
  TelegramComponent,
  UploadingFileInfo,
} from './types.js';

type TelegramBotOptions = {
  agentSettingsAccessor: AgentSettingsAccessorI;
  maxRequestConnections?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    TelegramJob,
    TelegramDispatchFrame,
    TelegramResult
  >;
};

type ApiCallOptions = {
  /** The bot user id/username/instance to make the API call with */
  channel: number | TelegramUser;
  /** Bot API method */
  method: string;
  /** Bot API parameter */
  params?: Record<string, unknown>;
  /** Attach files with the API request */
  uploadFiles?: UploadingFileInfo[];
};

/** @category Provider */
export class TelegramBot
  implements SociablyBot<TelegramChat, TelegramJob, TelegramResult>
{
  agentSettingsAccessor: AgentSettingsAccessorI;
  engine: Engine<
    TelegramUser | TelegramChat,
    TelegramSegmentValue,
    TelegramComponent<unknown>,
    TelegramJob,
    TelegramResult
  >;

  platform = TELEGRAM;

  constructor({
    agentSettingsAccessor,
    maxRequestConnections = 100,
    initScope,
    dispatchWrapper,
  }: TelegramBotOptions) {
    const queue = new Queue<TelegramJob, TelegramResult>();
    const worker = new TelegramWorker(
      agentSettingsAccessor,
      maxRequestConnections,
    );
    const renderer = new Renderer<
      TelegramSegmentValue,
      TelegramComponent<unknown>
    >(TELEGRAM, generalElementDelegate);

    this.agentSettingsAccessor = agentSettingsAccessor;
    this.engine = new Engine(
      TELEGRAM,
      renderer,
      queue,
      worker,
      initScope,
      dispatchWrapper,
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
    message: SociablyNode,
  ): Promise<null | TelegramDispatchResponse> {
    if (target instanceof TelegramUser) {
      return this.engine.render(target, message, createBotScopeJobs);
    }

    return this.engine.render(target, message, createChatJob);
  }

  async fetchFile(
    /** The ID or username or instance of the bot user */
    agentIdOrInstance: number | TelegramUser,
    fileId: string,
  ): Promise<null | {
    content: Readable;
    contentType?: string;
    contentLength?: number;
  }> {
    const agent =
      typeof agentIdOrInstance === 'number'
        ? new TelegramUser(agentIdOrInstance, true)
        : agentIdOrInstance;

    const agentSettings =
      await this.agentSettingsAccessor.getAgentSettings(agent);
    if (!agentSettings) {
      throw new Error(`Bot agent "${agent.id}" not registered`);
    }

    const { file_path: filePath } = await this.requestApi({
      channel: agent,
      method: 'getFile',
      params: { file_id: fileId },
    });

    if (!filePath) {
      return null;
    }

    const fetchResponse = await fetch(
      `https://api.telegram.org/file/bot${agentSettings.botToken}/${filePath}`,
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
      content: fetchResponse.body as Readable,
      contentType: fetchResponse.headers.get('content-type') || undefined,
      contentLength: contentLength ? Number(contentLength) : undefined,
    };
  }

  async requestApi<Result extends BotApiResult>({
    channel,
    method,
    params = {},
    uploadFiles,
  }: ApiCallOptions): Promise<Result> {
    try {
      const agentId = typeof channel === 'number' ? channel : channel.id;
      const response = await this.engine.dispatchJobs(
        new TelegramUser(agentId, true),
        [
          {
            agentId,
            method,
            params,
            key: undefined,
            files: uploadFiles || [],
          },
        ],
      );

      return response.results[0].result as Result;
    } catch (err) {
      if (err instanceof DispatchError) {
        throw err.errors[0];
      }
      throw err;
    }
  }
}

const BotP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    AgentSettingsAccessorI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    { maxRequestConnections },
    agentSettingsAccessor,
    moduleUtils,
    platformUtils,
  ) =>
    new TelegramBot({
      agentSettingsAccessor,
      maxRequestConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(TelegramBot);

type BotP = TelegramBot;
export default BotP;
