// @flow
import WS from 'ws';
import { Emitter, Controller, Engine, resolvePlugins } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import type { MachinatNode } from 'machinat/types';
import type { MachinatBot, SegmentWithoutPause } from 'machinat-base/types';
import type { HTTPUpgradeReceivable } from 'machinat-http-adaptor/types';
import type WebSocketChannel from './channel';
import type {
  WebSocketEvent,
  WebSocketMetadata,
  EventRenderValue,
  WebSocketResponse,
  WebSocketJob,
  WebSocketResult,
  WebSocketBotOptions,
  WebSocketComponent,
  SocketId,
} from './types';

import { WEBSOCKET, WEBSOCKET_NATIVE_TYPE } from './constant';
import Distributor from './distributor';
import { LocalOnlyBroker } from './broker';
import WebSocketReceiver from './receiver';
import WebSocketWorker from './worker';

const WSServer = WS.Server;

type WebSocketBotOptionsInput = $Shape<WebSocketBotOptions>;

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

class WebSocketBot
  extends Emitter<
    WebSocketChannel,
    WebSocketEvent,
    WebSocketMetadata,
    EventRenderValue,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult
  >
  implements
    HTTPUpgradeReceivable<WebSocketReceiver>,
    MachinatBot<
      WebSocketChannel,
      WebSocketEvent,
      WebSocketMetadata,
      WebSocketResponse,
      EventRenderValue,
      WebSocketComponent,
      WebSocketJob,
      WebSocketResult,
      WebSocketBotOptionsInput,
      void
    > {
  _distributor: Distributor;
  options: WebSocketBotOptions;
  receiver: WebSocketReceiver;

  controller: Controller<
    WebSocketChannel,
    WebSocketEvent,
    WebSocketMetadata,
    WebSocketResponse,
    EventRenderValue,
    WebSocketComponent
  >;

  engine: Engine<
    WebSocketChannel,
    EventRenderValue,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult
  >;

  worker: WebSocketWorker;

  constructor(optionsInput?: WebSocketBotOptionsInput) {
    super();

    const defaultOptions: WebSocketBotOptions = {
      verifyUpgrade: undefined,
    };
    const options = Object.assign(defaultOptions, optionsInput);
    this.options = options;

    const broker = new LocalOnlyBroker();
    const distributor = new Distributor(broker);
    this._distributor = distributor;

    const wsServer = new WSServer({ noServer: true });

    const { eventMiddlewares, dispatchMiddlewares } = resolvePlugins(
      this,
      options.plugins
    );

    this.controller = new Controller(WEBSOCKET, this, eventMiddlewares);
    this.receiver = new WebSocketReceiver(wsServer, distributor, options);

    this.receiver.bindIssuer(
      this.controller.eventIssuerThroughMiddlewares(this.emitEvent.bind(this)),
      this.emitError.bind(this)
    );

    const queue = new Queue();
    const worker = new WebSocketWorker(distributor);

    const renderer = new Renderer(WEBSOCKET, WEBSOCKET_NATIVE_TYPE, () => {
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
      dispatchMiddlewares
    );
  }

  async send(
    channel: WebSocketChannel,
    message: MachinatNode
  ): Promise<null | WebSocketResult[]> {
    const tasks = await this.engine.renderTasks(
      createJobs,
      channel,
      message,
      undefined,
      true
    );

    if (tasks === null) {
      return null;
    }

    const response = await this.engine.dispatch(channel, tasks, message);
    return response === null ? null : response.results;
  }

  disconnectSocket(
    channel: WebSocketChannel,
    socketId: SocketId,
    reason: string
  ) {
    return this._distributor.disconnectSocket(channel.uid, socketId, reason);
  }
}

export default WebSocketBot;
