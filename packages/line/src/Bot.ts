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

import { createChatJobs, createMulticastJobs } from './job.js';
import generalElementDelegate from './components/general.js';
import LineWorker from './Worker.js';
import LineChannel from './Channel.js';
import LineChat from './Chat.js';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import { LINE } from './constant.js';
import type {
  LineSegmentValue,
  LineComponent,
  LineJob,
  LineResult,
  LineDispatchFrame,
  LineDispatchResponse,
  MessagingApiResult,
} from './types.js';

type LineBotOptions = {
  agentSettingsAccessor: AgentSettingsAccessorI;
  maxRequestConnections?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<LineJob, LineDispatchFrame, LineResult>;
};

type ApiCallOptions = {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** API request URL relative to https://api.line.me/ */
  url: string;
  /** API request parameters */
  params?: Record<string, unknown>;
  /** The LINE messaging API channel to make the request */
  channel?: string | LineChannel;
  /** Force to use the access token */
  accessToken?: string;
};

/**
 * @category Provider
 */
export class LineBot implements SociablyBot<LineChat, LineJob, LineResult> {
  maxRequestConnections: number;
  engine: Engine<
    LineChannel | LineChat,
    LineSegmentValue,
    LineComponent<unknown>,
    LineJob,
    LineResult
  >;

  platform = LINE;

  constructor({
    agentSettingsAccessor,
    maxRequestConnections = 100,
    initScope,
    dispatchWrapper,
  }: LineBotOptions) {
    this.maxRequestConnections = maxRequestConnections;

    const queue = new Queue<LineJob, LineResult>();
    const worker = new LineWorker(agentSettingsAccessor, maxRequestConnections);
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
    chat: LineChat,
    message: SociablyNode,
    options?: { replyToken?: string }
  ): Promise<null | LineDispatchResponse> {
    return this.engine.render(
      chat,
      message,
      createChatJobs(options?.replyToken)
    );
  }

  renderMulticast(
    channel: LineChannel,
    targets: string[],
    message: SociablyNode
  ): Promise<null | LineDispatchResponse> {
    return this.engine.render(channel, message, createMulticastJobs(targets));
  }

  async requestApi<ResBody extends MessagingApiResult>({
    method,
    url,
    params,
    channel,
    accessToken,
  }: ApiCallOptions): Promise<ResBody> {
    try {
      const response = await this.engine.dispatchJobs(null, [
        {
          method: method ?? 'GET',
          url,
          params,
          chatChannelId: typeof channel === 'string' ? channel : channel?.id,
          accessToken,
          key: undefined,
        },
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
    platformUtils
  ) =>
    new LineBot({
      agentSettingsAccessor,
      maxRequestConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(LineBot);

type BotP = LineBot;

export default BotP;
