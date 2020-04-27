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
import generalElementDelegate from './component/general';
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
  channelId: string,
  connectionCapicity?: number,
};

class LineBot implements MachinatBot<LineChannel, LineJob, LineAPIResult> {
  channelId: string;
  engine: Engine<
    LineChannel,
    LineSegmentValue,
    LineComponent,
    LineJob,
    LineAPIResult,
    LineBot
  >;

  constructor(
    { accessToken, channelId, connectionCapicity = 100 }: LineBotOptions = {},
    initScope: InitScopeFn,
    dispatchWrapper: DispatchWrapper<LineJob, LineDispatchFrame, LineAPIResult>
  ) {
    invariant(accessToken, 'options.accessToken should not be empty');
    invariant(channelId, 'options.channelId should not be empty');

    this.channelId = channelId;

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
        : new LineChannel(
            this.channelId,
            typeof source === 'string'
              ? { type: 'user', userId: source }
              : source
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
    return this.engine.dispatchJobs(null, [{ method, path, body }]);
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
