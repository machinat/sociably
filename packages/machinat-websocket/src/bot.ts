import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import { provider, createEmptyScope } from '@machinat/core/service';
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

import { WEBSOCKET } from './constant';
import { PLATFORM_MOUNTER_I } from './interface';
import { TransmitterP } from './transmitter';
import { TopicChannel, ConnectionChannel, UserChannel } from './channel';
import WebSocketWorker from './worker';
import type {
  WebSocketChannel,
  EventInput,
  WebSocketJob,
  WebSocketResult,
  WebSocketComponent,
  WebSocketDispatchFrame,
  WebSocketPlatformMounter,
} from './types';

type WebSocketDispatchResponse = DispatchResponse<
  WebSocketJob,
  WebSocketResult
>;

/** @internal */
const createJobs = (
  channel: WebSocketChannel,
  segments: DispatchableSegment<EventInput>[]
): WebSocketJob[] => {
  return [
    {
      target: channel,
      events: segments.map((seg) =>
        seg.type === 'text'
          ? {
              kind: 'message',
              type: 'text',
              payload: seg.value,
            }
          : seg.value
      ),
      whitelist: null,
      blacklist: null,
    },
  ];
};

/**
 * @category Provider
 */
export class WebSocketBot
  implements MachinatBot<WebSocketChannel, WebSocketJob, WebSocketResult> {
  private _transmitter: TransmitterP;
  engine: Engine<
    WebSocketChannel,
    EventInput,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult,
    WebSocketBot
  >;

  constructor(
    transmitter: TransmitterP,
    initScope: InitScopeFn = () => createEmptyScope(WEBSOCKET),
    dispatchWrapper: DispatchWrapper<
      WebSocketJob,
      WebSocketDispatchFrame,
      WebSocketResult
    > = (dispatch) => dispatch
  ) {
    this._transmitter = transmitter;

    const queue = new Queue<WebSocketJob, WebSocketResult>();
    const worker = new WebSocketWorker(transmitter);

    const renderer = new Renderer<EventInput, WebSocketComponent>(
      WEBSOCKET,
      () => {
        throw new TypeError(
          'general component not supported at websocket platform'
        );
      }
    );

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

  async start(): Promise<void> {
    await this._transmitter.start();
    this.engine.start();
  }

  async stop(): Promise<void> {
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
    ...events: EventInput[]
  ): Promise<WebSocketDispatchResponse> {
    return this.engine.dispatchJobs(channel, [
      {
        target: channel,
        events,
        whitelist: null,
        blacklist: null,
      },
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
    ...events: EventInput[]
  ): Promise<WebSocketDispatchResponse> {
    const channel = new UserChannel(user);
    return this.engine.dispatchJobs(channel, [
      {
        target: channel,
        events,
        whitelist: null,
        blacklist: null,
      },
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
    ...events: EventInput[]
  ): Promise<WebSocketDispatchResponse> {
    const channel = new TopicChannel(topic);
    return this.engine.dispatchJobs(channel, [
      {
        target: channel,
        events,
        whitelist: null,
        blacklist: null,
      },
    ]);
  }

  disconnect(connection: ConnectionChannel, reason?: string): Promise<boolean> {
    return this._transmitter.disconnect(connection, reason);
  }

  subscribeTopic(
    connection: ConnectionChannel,
    topic: string
  ): Promise<boolean> {
    return this._transmitter.subscribeTopic(connection, topic);
  }

  unsubscribeTopic(
    connection: ConnectionChannel,
    topic: string
  ): Promise<boolean> {
    return this._transmitter.unsubscribeTopic(connection, topic);
  }
}

export const BotP = provider<WebSocketBot>({
  lifetime: 'singleton',
  deps: [TransmitterP, { require: PLATFORM_MOUNTER_I, optional: true }],
  factory: (
    transmitter: TransmitterP,
    mounter: null | WebSocketPlatformMounter<any>
  ) =>
    new WebSocketBot(transmitter, mounter?.initScope, mounter?.dispatchWrapper),
})(WebSocketBot);

export type BotP = WebSocketBot;
