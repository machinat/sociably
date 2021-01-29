import invariant from 'invariant';
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

import { chatJobsMaker, multicastJobsMaker } from './job';
import generalElementDelegate from './components/general';
import LineWorker from './worker';
import LineChat from './channel';
import { ConfigsI, PlatformMounterI } from './interface';
import { LINE } from './constant';
import type {
  LineSource,
  LineSegmentValue,
  LineComponent,
  LineJob,
  LineResult,
  LineDispatchFrame,
  LineDispatchResponse,
  MessagingApiResult,
} from './types';

type LineBotOptions = {
  providerId: string;
  channelId: string;
  accessToken: string;
  maxConnections?: number;
};

/**
 * @category Provider
 */
export class LineBot implements MachinatBot<LineChat, LineJob, LineResult> {
  providerId: string;
  channelId: string;
  maxConnections: number;
  engine: Engine<
    LineChat,
    LineSegmentValue,
    LineComponent<unknown>,
    LineJob,
    LineResult,
    LineBot
  >;

  constructor(
    {
      providerId,
      channelId,
      accessToken,
      maxConnections = 100,
    }: LineBotOptions,
    initScope: InitScopeFn = () => createEmptyScope(LINE),
    dispatchWrapper: DispatchWrapper<LineJob, LineDispatchFrame, LineResult> = (
      dispatch
    ) => dispatch
  ) {
    invariant(accessToken, 'configs.accessToken should not be empty');
    invariant(providerId, 'configs.providerId should not be empty');
    invariant(channelId, 'configs.channelId should not be empty');

    this.providerId = providerId;
    this.channelId = channelId;
    this.maxConnections = maxConnections;

    const queue = new Queue<LineJob, LineResult>();
    const worker = new LineWorker(accessToken, maxConnections);
    const renderer = new Renderer<LineSegmentValue, LineComponent<unknown>>(
      LINE,
      generalElementDelegate
    );

    this.engine = new Engine(
      LINE,
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
    source: string | LineSource | LineChat,
    message: MachinatNode,
    options?: { replyToken?: string }
  ): Promise<null | LineDispatchResponse> {
    const channel =
      source instanceof LineChat
        ? source
        : typeof source === 'string'
        ? new LineChat(this.channelId, 'user', source)
        : LineChat.fromMessagingSource(this.channelId, source);

    return this.engine.render(
      channel,
      message,
      chatJobsMaker(options && options.replyToken)
    );
  }

  renderMulticast(
    targets: string[],
    message: MachinatNode
  ): Promise<null | LineDispatchResponse> {
    return this.engine.render(null, message, multicastJobsMaker(targets));
  }

  async makeApiCall<ResBody extends MessagingApiResult>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<ResBody> {
    try {
      const response = await this.engine.dispatchJobs(null, [
        { method, path, body, executionKey: undefined },
      ]);

      return response.results[0].body as ResBody;
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
  deps: [ConfigsI, { require: PlatformMounterI, optional: true }] as const,
  factory: (configs, mounter) =>
    new LineBot(configs, mounter?.initScope, mounter?.dispatchWrapper),
})(LineBot);

export type BotP = LineBot;
