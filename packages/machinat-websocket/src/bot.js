// @flow
import WS from 'ws';
import { BaseBot, Engine, Controller } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import type { MachinatNode } from 'machinat/types';
import type { SegmentWithoutPause } from 'machinat-base/types';
import type { MachinatNativeComponent } from 'machinat-renderer/types';
import type WebSocketChannel from './channel';
import type {
  WebSocketEvent,
  WebSocketTransport,
  EventRenderValue,
  WebSocketResponse,
  WebSocketJob,
  WebSocketResult,
  WebSocketBotOptions,
  ChannelUid,
  SocketId,
  SocketBroker,
} from './types';

import { WEBSOCKET, WEBSOCKET_NATIVE_TYPE } from './constant';
import Distributor from './distributor';
import { LocalOnlyBroker } from './broker';
import Receiver from './receiver';
import Worker from './worker';

const WSServer = WS.Server;

type WebSocketBotOptionsInput = $Shape<WebSocketBotOptions>;
type WebSocketComponent = MachinatNativeComponent<EventRenderValue>;

const createJobs = (
  channel: WebSocketChannel,
  segments: SegmentWithoutPause<EventRenderValue, WebSocketComponent>[]
): WebSocketJob[] => {
  const jobs = new Array(segments.length);
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    jobs[i] =
      segment.type === 'text'
        ? {
            type: 'message',
            subtype: 'text',
            payload: segment.value,
            uid: channel.uid,
          }
        : { ...segment.value, uid: channel.uid };
  }
  return jobs;
};

class WebSocketBot extends BaseBot<
  WebSocketChannel,
  WebSocketEvent,
  WebSocketTransport,
  EventRenderValue,
  WebSocketComponent,
  WebSocketResponse,
  WebSocketJob,
  WebSocketResult
> {
  _broker: SocketBroker;
  options: WebSocketBotOptions;

  constructor(optionsInput?: WebSocketBotOptionsInput) {
    const defaultOptions: WebSocketBotOptions = {
      verifyUpgrade: undefined,
    };
    const options = Object.assign(defaultOptions, optionsInput);

    const distributor = new Distributor();
    const broker = new LocalOnlyBroker(distributor);
    const worker = new Worker(broker);

    const wsServer = new WSServer({ noServer: true });

    const receiver = new Receiver(wsServer, distributor, options);
    const controller = new Controller();

    const renderer = new Renderer(WEBSOCKET, WEBSOCKET_NATIVE_TYPE, () => {
      throw new TypeError(
        'general component not supported at websocket platform'
      );
    });

    const queue = new Queue();
    const engine = new Engine(WEBSOCKET, renderer, queue, worker);

    super(receiver, controller, engine);

    this._broker = broker;
    this.options = options;
  }

  async send(
    channel: WebSocketChannel,
    message: MachinatNode
  ): Promise<null | WebSocketResult[]> {
    const actions = this.engine.renderActions(
      createJobs,
      channel,
      message,
      undefined,
      false
    );
    if (actions === null) return null;

    const response = await this.engine.dispatch(channel, actions, message);
    return response === null ? null : response.results;
  }

  disconnect(uid: ChannelUid, socketId: SocketId, reason: string) {
    return this._broker.unlinkConnection(uid, socketId, reason);
  }
}

export default WebSocketBot;
