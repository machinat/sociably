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
import LineChannel from './channel';
import { LINE_PLATFORM_CONFIGS_I, LINE_PLATFORM_MOUNTER_I } from './interface';
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
  providerId: string;
  channelId: string;
  connectionCapicity?: number;
};

export class LineBot
  implements MachinatBot<LineChannel, LineJob, LineAPIResult> {
  providerId: string;
  botChannelId: string;
  engine: Engine<
    LineChannel,
    LineSegmentValue,
    LineComponent,
    LineJob,
    LineAPIResult,
    LineBot
  >;

  constructor(
    {
      accessToken,
      providerId,
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
    invariant(providerId, 'configs.providerId should not be empty');
    invariant(channelId, 'configs.channelId should not be empty');

    this.providerId = providerId;
    this.botChannelId = channelId;

    const queue = new Queue<LineJob, LineAPIResult>();
    const worker = new LineWorker(accessToken, connectionCapicity);
    const renderer = new Renderer<LineSegmentValue, LineComponent>(
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
    source: string | LineSource | LineChannel,
    message: MachinatNode,
    options?: { replyToken?: string }
  ): Promise<null | LineDispatchResponse> {
    const channel =
      source instanceof LineChannel
        ? source
        : typeof source === 'string'
        ? new LineChannel(this.providerId, this.botChannelId, 'utob', source)
        : LineChannel.fromMessagingSource(
            this.providerId,
            this.botChannelId,
            source
          );

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

  dispatchAPICall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: null | Record<string, unknown>
  ): Promise<LineDispatchResponse> {
    return this.engine.dispatchJobs(null, [
      { method, path, body, executionKey: undefined },
    ]);
  }
}

export default provider<LineBot>({
  lifetime: 'singleton',
  deps: [
    LINE_PLATFORM_CONFIGS_I,
    { require: LINE_PLATFORM_MOUNTER_I, optional: true },
  ],
  factory: (
    configs: LinePlatformConfigs,
    mounter: null | LinePlatformMounter
  ) => new LineBot(configs, mounter?.initScope, mounter?.dispatchWrapper),
})(LineBot);
