// @flow
import invariant from 'invariant';
import WS from 'ws';
import uniqid from 'uniqid';
import { Emitter, Controller, Engine, resolvePlugins } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import type { MachinatNode, MachinatUser } from 'machinat/types';
import type { MachinatBot, SegmentWithoutPause } from 'machinat-base/types';
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
  ServerAuthenticatorFunc,
} from './types';
import type { TopicScopeChannel } from './channel';
import type Connection from './connection';

import { WEBSOCKET, WEBSOCKET_NATIVE_TYPE } from './constant';
import Distributor from './distributor';
import { LocalOnlyBroker } from './broker';
import WebSocketReceiver from './receiver';
import WebSocketWorker from './worker';

const WSServer = WS.Server;

const allowDefaultAuthentication: ServerAuthenticatorFunc = async (
  request,
  { type }
) =>
  type === 'default'
    ? {
        accepted: true,
        user: null,
        tags: null,
        context: { type: 'default' },
      }
    : {
        accepted: false,
        reason: 'only registration with "default" type allowed by default',
      };

const createJobs = (
  scope: WebSocketChannel,
  segments: SegmentWithoutPause<EventOrder, WebSocketComponent>[]
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

type WebSocketBotOptionsInput = $Shape<WebSocketBotOptions>;

class WebSocketBot
  extends Emitter<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata,
    EventOrder,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult,
    void
  >
  implements
    HTTPUpgradeReceivable<WebSocketReceiver>,
    MachinatBot<
      WebSocketChannel,
      ?MachinatUser,
      WebSocketEvent,
      WebSocketMetadata,
      void,
      EventOrder,
      WebSocketComponent,
      WebSocketJob,
      WebSocketResult,
      void,
      WebSocketBotOptionsInput
    > {
  options: WebSocketBotOptions;
  _distributor: Distributor;

  receiver: WebSocketReceiver;
  controller: Controller<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata,
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

  constructor(optionsInput?: WebSocketBotOptionsInput) {
    super();
    const defaultOptions: WebSocketBotOptions = {
      verifyUpgrade: undefined,
    };

    const options = Object.assign(defaultOptions, optionsInput);
    this.options = options;

    const broker = new LocalOnlyBroker();

    const serverId = uniqid();
    this._distributor = new Distributor(serverId, broker, err =>
      this.emitError(err)
    );

    const wsServer = new WSServer({ noServer: true });

    const { eventMiddlewares, dispatchMiddlewares } = resolvePlugins(
      this,
      options.plugins
    );

    this.controller = new Controller(WEBSOCKET, this, eventMiddlewares);

    this.receiver = new WebSocketReceiver(
      serverId,
      wsServer,
      this._distributor,
      options.authenticator || allowDefaultAuthentication,
      options.verifyUpgrade || (() => true)
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
