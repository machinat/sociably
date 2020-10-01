import invariant from 'invariant';
import fetch from 'node-fetch';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Engine from '@machinat/core/engine';
import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core/types';
import { provider, createEmptyScope } from '@machinat/core/service';

import { createChatJob, createUpdatingInlineMessageJobs } from './job';
import generalElementDelegate from './components/general';
import TelegramWorker from './worker';
import { TelegramChat, TelegramChatTarget } from './channel';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { TELEGRAM } from './constant';
import TelegramAPIError from './error';
import type {
  TelegramPlatformConfigs,
  TelegramSegmentValue,
  TelegramJob,
  TelegramAPIResult,
  TelegramDispatchFrame,
  TelegramDispatchResponse,
  TelegramPlatformMounter,
  UploadingFile,
  TelegramComponent,
} from './types';

type TelegramBotOptions = {
  botToken: string;
  connectionCapicity?: number;
};

/**
 * @category Provider
 */
export class TelegramBot
  implements
    MachinatBot<
      TelegramChat | TelegramChatTarget,
      TelegramJob,
      TelegramAPIResult
    > {
  botToken: string;
  botId: number;
  engine: Engine<
    TelegramChat | TelegramChatTarget,
    TelegramSegmentValue,
    TelegramComponent<any>,
    TelegramJob,
    TelegramAPIResult,
    TelegramBot
  >;

  constructor(
    { botToken, connectionCapicity = 100 }: TelegramBotOptions = {} as any,
    initScope: InitScopeFn = () => createEmptyScope(TELEGRAM),
    dispatchWrapper: DispatchWrapper<
      TelegramJob,
      TelegramDispatchFrame,
      TelegramAPIResult
    > = (dispatch) => dispatch
  ) {
    invariant(botToken, 'options.botToken should not be empty');

    this.botToken = botToken;
    this.botId = Number(botToken.split(':', 1)[0]);

    const queue = new Queue<TelegramJob, TelegramAPIResult>();
    const worker = new TelegramWorker(botToken, connectionCapicity);
    const renderer = new Renderer<TelegramSegmentValue, TelegramComponent<any>>(
      TELEGRAM,
      generalElementDelegate
    );

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
        : new TelegramChatTarget(this.botId, target);

    return this.engine.render(channel, message, createChatJob);
  }

  renderUpdatingInlineMessages(
    message: MachinatNode
  ): Promise<null | TelegramDispatchResponse> {
    return this.engine.render(null, message, createUpdatingInlineMessageJobs);
  }

  async fetchFile(
    fileId: string
  ): Promise<null | {
    content: NodeJS.ReadableStream;
    contentType: string;
    contentLength: number;
  }> {
    const {
      result: { file_path: filePath },
    } = await this.dispatchAPICall('getFile', { file_id: fileId });
    if (!filePath) {
      return null;
    }

    const fetchResponse = await fetch(
      `https://api.telegram.org/file/bot${this.botToken}/${filePath}`
    );

    if (!fetchResponse.ok) {
      throw new TelegramAPIError({
        ok: false,
        description: fetchResponse.statusText,
        error_code: fetchResponse.status,
      });
    }

    return {
      content: fetchResponse.body,
      contentType: fetchResponse.headers.get('content-type'),
      contentLength: Number(fetchResponse.headers.get('content-length')),
    };
  }

  async dispatchAPICall(
    method: string,
    parameters: Record<string, any> = {},
    uploadingFiles?: UploadingFile[]
  ): Promise<TelegramAPIResult> {
    const response = await this.engine.dispatchJobs(null, [
      {
        method,
        parameters,
        executionKey: undefined,
        uploadingFiles: uploadingFiles || null,
      },
    ]);

    return response.results[0];
  }
}

export const BotP = provider<TelegramBot>({
  lifetime: 'singleton',
  deps: [PLATFORM_CONFIGS_I, { require: PLATFORM_MOUNTER_I, optional: true }],
  factory: (
    { botToken, connectionCapicity }: TelegramPlatformConfigs,
    mounter: null | TelegramPlatformMounter
  ) => {
    return new TelegramBot(
      { botToken, connectionCapicity },
      mounter?.initScope,
      mounter?.dispatchWrapper
    );
  },
})(TelegramBot);

export type BotP = TelegramBot;
