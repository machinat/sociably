// @flow
import WS from 'ws';
import { BaseBot } from 'machinat-base';
import Renderer from 'machinat-renderer';

import type { MachinatNode } from 'machinat/types';
import type { SegmentWithoutPause } from 'machinat-base/types';
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
  extends BaseBot<
    WebSocketChannel,
    WebSocketEvent,
    WebSocketMetadata,
    WebSocketResponse,
    EventRenderValue,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult
  >
  implements HTTPUpgradeReceivable {
  _distributor: Distributor;
  options: WebSocketBotOptions;
  // $FlowFixMe https://github.com/facebook/flow/issues/7539
  receiver: WebSocketReceiver;
  worker: WebSocketWorker;

  constructor(optionsInput?: WebSocketBotOptionsInput) {
    const defaultOptions: WebSocketBotOptions = {
      verifyUpgrade: undefined,
    };
    const options = Object.assign(defaultOptions, optionsInput);

    const broker = new LocalOnlyBroker();
    const distributor = new Distributor(broker);
    const worker = new WebSocketWorker(distributor);

    const wsServer = new WSServer({ noServer: true });

    const receiver = new WebSocketReceiver(wsServer, distributor, options);

    const renderer = new Renderer(WEBSOCKET, WEBSOCKET_NATIVE_TYPE, () => {
      throw new TypeError(
        'general component not supported at websocket platform'
      );
    });

    super(WEBSOCKET, receiver, renderer, worker, options.plugins);

    this._distributor = distributor;
    this.options = options;
    this.receiver = receiver;
    this.worker = worker;
  }

  async send(
    channel: WebSocketChannel,
    message: MachinatNode
  ): Promise<null | WebSocketResult[]> {
    const tasks = this.engine.renderTasks(
      createJobs,
      channel,
      message,
      undefined,
      true
    );
    if (tasks === null) return null;

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
