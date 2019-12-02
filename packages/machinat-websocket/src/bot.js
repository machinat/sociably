// @flow
import invariant from 'invariant';
import WS from 'ws';
import uniqid from 'uniqid';
import { Emitter, Controller, Engine, resolvePlugins } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import type { MachinatNode, MachinatUser } from 'machinat/types';
import type { MachinatBot, OutputableSegment } from 'machinat-base/types';
import type { HTTPUpgradeReceivable } from 'machinat-http-adaptor/types';
import type {
  WebSocketChannel,
  WebSocketEvent,
  WebSocketMetadata,
  EventOrder,
  WebSocketJob,
  WebSocketResult,
  WebSocketBotOptions,
  WebSocketComponent,
} from './types';
import type { TopicScopeChannel } from './channel';
import type Connection from './connection';

import { WEBSOCKET, WEBSOCKET_NATIVE_TYPE } from './constant';
import Distributor from './distributor';
import { LocalOnlyBroker } from './broker';
import WebSocketReceiver from './receiver';
import WebSocketWorker from './worker';

const WSServer = WS.Server;

const createJobs = (
  scope: WebSocketChannel,
  segments: OutputableSegment<EventOrder, WebSocketComponent>[]
): WebSocketJob[] => {
  return segments.map(seg => ({
    scope,
    order:
      seg.type === 'text'
        ? {
            type: 'message',
            subtype: 'text',
            payload: seg.value,
          }
        : seg.value,
  }));
};

class WebSocketBot<AuthCtx, RegData>
  extends Emitter<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata<AuthCtx>,
    EventOrder,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult,
    void
  >
  implements
    HTTPUpgradeReceivable<WebSocketReceiver<AuthCtx, RegData>>,
    MachinatBot<
      WebSocketChannel,
      ?MachinatUser,
      WebSocketEvent,
      WebSocketMetadata<AuthCtx>,
      void,
      EventOrder,
      WebSocketComponent,
      WebSocketJob,
      WebSocketResult,
      void,
      WebSocketBotOptions<AuthCtx, RegData>
    > {
  _distributor: Distributor;

  receiver: WebSocketReceiver<AuthCtx, RegData>;
  controller: Controller<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata<AuthCtx>,
    void,
    EventOrder,
    WebSocketComponent,
    void
  >;

  engine: Engine<
    WebSocketChannel,
    EventOrder,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult
  >;

  worker: WebSocketWorker;

  constructor({
    authenticator,
    verifyUpgrade,
    plugins,
  }: WebSocketBotOptions<AuthCtx, RegData> = {}) {
    invariant(authenticator, 'options.authenticator should not be empty');

    super();

    const broker = new LocalOnlyBroker();

    const serverId = uniqid();
    this._distributor = new Distributor(serverId, broker, err =>
      this.emitError(err)
    );

    const wsServer = new WSServer({ noServer: true });

    const { eventMiddlewares, dispatchMiddlewares } = resolvePlugins(
      this,
      plugins
    );

    this.controller = new Controller(WEBSOCKET, this, eventMiddlewares);

    this.receiver = new WebSocketReceiver(
      serverId,
      wsServer,
      this._distributor,
      authenticator,
      verifyUpgrade || (() => true)
    );

    this.receiver.bindIssuer(
      this.controller.eventIssuerThroughMiddlewares(this.emitEvent.bind(this)),
      this.emitError.bind(this)
    );

    const queue = new Queue();
    const worker = new WebSocketWorker(this._distributor);

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

  async render(
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

  disconnect(connection: Connection, reason: string) {
    return this._distributor.disconnect(connection, reason);
  }

  attachTopic(connection: Connection, scope: TopicScopeChannel) {
    invariant(
      scope.platform === WEBSOCKET && scope.type === 'topic',
      `expect a "topic" scope to attach, get: "${scope.type}"`
    );
    return this._distributor.attachTopic(connection, scope);
  }

  detachTopic(connection: Connection, scope: TopicScopeChannel) {
    invariant(
      scope.platform === WEBSOCKET && scope.type === 'topic',
      `expect a "topic" scope to detach, get: "${scope.type}"`
    );
    return this._distributor.detachTopic(connection, scope);
  }
}

export default WebSocketBot;
