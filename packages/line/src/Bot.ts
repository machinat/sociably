import invariant from 'invariant';
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

import { createChatJobs, createMulticastJobs } from './job';
import generalElementDelegate from './components/general';
import LineWorker from './Worker';
import LineChat from './Chat';
import { ConfigsI, PlatformUtilitiesI } from './interface';
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
  maxRequestConnections?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<LineJob, LineDispatchFrame, LineResult>;
};

/**
 * @category Provider
 */
export class LineBot implements SociablyBot<LineChat, LineJob, LineResult> {
  providerId: string;
  channelId: string;
  maxRequestConnections: number;
  engine: Engine<
    LineChat,
    LineSegmentValue,
    LineComponent<unknown>,
    LineJob,
    LineResult
  >;

  platform = LINE;

  constructor({
    providerId,
    channelId,
    accessToken,
    maxRequestConnections = 100,
    initScope,
    dispatchWrapper,
  }: LineBotOptions) {
    invariant(accessToken, 'configs.accessToken should not be empty');
    invariant(providerId, 'configs.providerId should not be empty');
    invariant(channelId, 'configs.channelId should not be empty');

    this.providerId = providerId;
    this.channelId = channelId;
    this.maxRequestConnections = maxRequestConnections;

    const queue = new Queue<LineJob, LineResult>();
    const worker = new LineWorker(accessToken, maxRequestConnections);
    const renderer = new Renderer<LineSegmentValue, LineComponent<unknown>>(
      LINE,
      generalElementDelegate
    );

    this.engine = new Engine(
      LINE,
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
    message: SociablyNode,
    options?: { replyToken?: string }
  ): Promise<null | LineDispatchResponse> {
    const thread =
      source instanceof LineChat
        ? source
        : typeof source === 'string'
        ? new LineChat(this.channelId, 'user', source)
        : LineChat.fromMessagingSource(this.channelId, source);

    return this.engine.render(
      thread,
      message,
      createChatJobs(options && options.replyToken)
    );
  }

  renderMulticast(
    targets: string[],
    message: SociablyNode
  ): Promise<null | LineDispatchResponse> {
    return this.engine.render(null, message, createMulticastJobs(targets));
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

const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    { providerId, channelId, accessToken, maxRequestConnections },
    moduleUtils,
    platformUtils
  ) =>
    new LineBot({
      providerId,
      channelId,
      accessToken,
      maxRequestConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(LineBot);

type BotP = LineBot;

export default BotP;
