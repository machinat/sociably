import invariant from 'invariant';
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

import { chatJobsMaker, multicastJobsMaker } from './job';
import generalElementDelegate from './components/general';
import LineWorker from './worker';
import LineChat from './channel';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { LINE } from './constant';

import type {
  LineSource,
  LinePlatformConfigs,
  LineSegmentValue,
  LineComponent,
  LineJob,
  LineAPIResult,
  LineDispatchFrame,
  LineDispatchResponse,
  LinePlatformMounter,
} from './types';

type LineBotOptions = {
  accessToken: string;
  channelId: string;
  connectionCapicity?: number;
};

/**
 * @category Provider
 */
export class LineBot implements MachinatBot<LineChat, LineJob, LineAPIResult> {
  providerId: string;
  botChannelId: string;
  engine: Engine<
    LineChat,
    LineSegmentValue,
    LineComponent<any>,
    LineJob,
    LineAPIResult,
    LineBot
  >;

  constructor(
    {
      accessToken,
      channelId,
      connectionCapicity = 100,
    }: LineBotOptions = {} as any,
    initScope: InitScopeFn = () => createEmptyScope(LINE),
    dispatchWrapper: DispatchWrapper<
      LineJob,
      LineDispatchFrame,
      LineAPIResult
    > = (dispatch) => dispatch
  ) {
    invariant(accessToken, 'configs.accessToken should not be empty');
    invariant(channelId, 'configs.channelId should not be empty');

    this.botChannelId = channelId;

    const queue = new Queue<LineJob, LineAPIResult>();
    const worker = new LineWorker(accessToken, connectionCapicity);
    const renderer = new Renderer<LineSegmentValue, LineComponent<any>>(
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
        ? new LineChat(this.botChannelId, 'user', source)
        : LineChat.fromMessagingSource(this.botChannelId, source);

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

  async dispatchAPICall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: null | Record<string, unknown>
  ): Promise<LineAPIResult> {
    const response = await this.engine.dispatchJobs(null, [
      { method, path, body, executionKey: undefined },
    ]);

    return response.results[0];
  }
}

export const BotP = provider<LineBot>({
  lifetime: 'singleton',
  deps: [PLATFORM_CONFIGS_I, { require: PLATFORM_MOUNTER_I, optional: true }],
  factory: (
    configs: LinePlatformConfigs,
    mounter: null | LinePlatformMounter
  ) => new LineBot(configs, mounter?.initScope, mounter?.dispatchWrapper),
})(LineBot);

export type BotP = LineBot;
