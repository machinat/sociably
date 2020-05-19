// @flow
import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import { provider } from '@machinat/core/service';
import type {
  MachinatNode,
  MachinatBot,
  MachinatUser,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core/types';
import type {
  DispatchableSegment,
  DispatchResponse,
} from '@machinat/core/engine/types';
import type {
  WebSocketChannel,
  EventValue,
  WebSocketJob,
  WebSocketResult,
  WebSocketComponent,
  WebSocketDispatchFrame,
  WebSocketPlatformMounter,
} from './types';
import { TopicChannel, ConnectionChannel, UserChannel } from './channel';
import { WEBSOCKET_PLATFORM_MOUNTER_I } from './interface';
import { WEBSOCKET } from './constant';
import Transmitter from './transmitter';
import WebSocketWorker from './worker';

type WebSocketDispatchResponse = DispatchResponse<
  WebSocketJob,
  WebSocketResult
>;

const createJobs = (
  channel: WebSocketChannel,
  segments: DispatchableSegment<EventValue, WebSocketComponent>[]
): WebSocketJob[] => {
  return [
    {
      target: channel,
      events: segments.map((seg) =>
        seg.type === 'text'
          ? {
              type: 'message',
              subtype: 'text',
              payload: seg.value,
            }
          : seg.value
      ),
      whitelist: null,
      blacklist: null,
    },
  ];
};

class WebSocketBot
  implements MachinatBot<WebSocketChannel, WebSocketJob, WebSocketResult> {
  _transmitter: Transmitter;
  engine: Engine<
    WebSocketChannel,
    EventValue,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult,
    WebSocketBot
  >;

  constructor(
    transmitter: Transmitter,
    initScope: InitScopeFn,
    dispatchWrapper: DispatchWrapper<
      WebSocketJob,
      WebSocketDispatchFrame,
      WebSocketResult
    >
  ) {
    this._transmitter = transmitter;

    const queue = new Queue();
    const worker = new WebSocketWorker(transmitter);

    const renderer = new Renderer(WEBSOCKET, () => {
      throw new TypeError(
        'general component not supported at websocket platform'
      );
    });

    this.engine = new Engine(
      WEBSOCKET,
      this,
      renderer,
      queue,
      worker,
      initScope,
      dispatchWrapper
    );
  }

  async start() {
    await this._transmitter.start();
    this.engine.start();
  }

  async stop() {
    await this._transmitter.stop();
    this.engine.stop();
  }

  render(
    channel: WebSocketChannel,
    message: MachinatNode
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render(channel, message, createJobs);
  }

  send(
    channel: WebSocketChannel,
    ...events: EventValue[]
  ): Promise<WebSocketDispatchResponse> {
    return this.engine.dispatchJobs(channel, [
      { target: channel, events, whitelist: null, blacklist: null },
    ]);
  }

  renderUser(
    user: MachinatUser,
    message: MachinatNode
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render(new UserChannel(user), message, createJobs);
  }

  sendUser(
    user: MachinatUser,
    ...events: EventValue[]
  ): Promise<WebSocketDispatchResponse> {
    const channel = new UserChannel(user);
    return this.engine.dispatchJobs(channel, [
      { target: channel, events, whitelist: null, blacklist: null },
    ]);
  }

  renderTopic(
    topic: string,
    message: MachinatNode
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render(new TopicChannel(topic), message, createJobs);
  }

  sendTopic(
    topic: string,
    ...events: EventValue[]
  ): Promise<WebSocketDispatchResponse> {
    const channel = new TopicChannel(topic);
    return this.engine.dispatchJobs(channel, [
      { target: channel, events, whitelist: null, blacklist: null },
    ]);
  }

  disconnect(connection: ConnectionChannel, reason?: string) {
    return this._transmitter.disconnect(connection, reason);
  }

  attachTopic(connection: ConnectionChannel, topic: string) {
    return this._transmitter.attachTopic(connection, topic);
  }

  detachTopic(connection: ConnectionChannel, topic: string) {
    return this._transmitter.detachTopic(connection, topic);
  }
}

export default provider<WebSocketBot>({
  lifetime: 'singleton',
  deps: [Transmitter, WEBSOCKET_PLATFORM_MOUNTER_I],
  factory: (
    transmitter: Transmitter,
    { initScope, dispatchWrapper }: WebSocketPlatformMounter<any>
  ) => new WebSocketBot(transmitter, initScope, dispatchWrapper),
})(WebSocketBot);
