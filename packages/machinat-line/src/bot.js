// @flow
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
import { provider } from '@machinat/core/service';

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
  accessToken: string,
  providerId: string,
  botChannelId: string,
  connectionCapicity?: number,
};

class LineBot implements MachinatBot<LineChannel, LineJob, LineAPIResult> {
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
      botChannelId,
      connectionCapicity = 100,
    }: LineBotOptions = {},
    initScope: InitScopeFn,
    dispatchWrapper: DispatchWrapper<LineJob, LineDispatchFrame, LineAPIResult>
  ) {
    invariant(accessToken, 'options.accessToken should not be empty');

    this.providerId = providerId;
    this.botChannelId = botChannelId;

    const renderer = new Renderer(LINE, generalElementDelegate);
    const queue = new Queue();
    const worker = new LineWorker(accessToken, connectionCapicity);

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

  async start() {
    this.engine.start();
  }

  async stop() {
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
    body: Object
  ): Promise<LineDispatchResponse> {
    return this.engine.dispatchJobs(null, [
      { method, path, body, executionKey: undefined },
    ]);
  }
}

export default provider<LineBot>({
  lifetime: 'singleton',
  deps: [LINE_PLATFORM_CONFIGS_I, LINE_PLATFORM_MOUNTER_I],
  factory: (
    configs: LinePlatformConfigs,
    { initScope, dispatchWrapper }: LinePlatformMounter
  ) => new LineBot(configs, initScope, dispatchWrapper),
})(LineBot);
