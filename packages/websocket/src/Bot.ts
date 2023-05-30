import type {
  SociablyNode,
  SociablyBot,
  InitScopeFn,
  DispatchWrapper,
} from '@sociably/core';
import Engine from '@sociably/core/engine';
import Renderer from '@sociably/core/renderer';
import Queue from '@sociably/core/queue';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import { serviceProviderClass } from '@sociably/core/service';

import { WEBSOCKET } from './constant.js';
import { PlatformUtilitiesI } from './interface.js';
import { ServerP } from './Server.js';
import WebSocketConnection from './Connection.js';
import createJobs from './utils/createJobs.js';
import WebSocketWorker from './Worker.js';
import type {
  EventInput,
  WebSocketJob,
  WebSocketResult,
  WebSocketComponent,
  WebSocketDispatchFrame,
  ConnIdentifier,
  WebSocketDispatchResponse,
} from './types.js';

type SendResult = {
  connections: WebSocketConnection[];
};

const toConnection = ({ serverId, id }: ConnIdentifier) =>
  new WebSocketConnection(serverId, id);

/**
 * @category Provider
 */
export class WebSocketBot
  implements SociablyBot<WebSocketConnection, WebSocketJob, WebSocketResult>
{
  private _server: ServerP<any, unknown>;
  engine: Engine<
    WebSocketConnection,
    EventInput,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult
  >;

  platform = WEBSOCKET;

  constructor(
    server: ServerP<any, unknown>,
    initScope?: InitScopeFn,
    dispatchWrapper?: DispatchWrapper<
      WebSocketJob,
      WebSocketDispatchFrame,
      WebSocketResult
    >
  ) {
    this._server = server;

    const queue = new Queue<WebSocketJob, WebSocketResult>();
    const worker = new WebSocketWorker(server);

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
      renderer,
      queue,
      worker,
      initScope,
      dispatchWrapper
    );
  }

  async start(): Promise<void> {
    await this._server.start();
    this.engine.start();
  }

  async stop(): Promise<void> {
    await this._server.stop();
    this.engine.stop();
  }

  render(
    thread: WebSocketConnection,
    message: SociablyNode
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render<WebSocketConnection>(thread, message, createJobs);
  }

  async send(
    connection: WebSocketConnection,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const {
      results: [{ connections }],
    } = await this.engine.dispatchJobs(connection, [
      {
        target: connection,
        values: Array.isArray(content) ? content : [content],
      },
    ]);

    return { connections: connections.map(toConnection) };
  }

  async sendTopic(
    key: string,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const {
      results: [{ connections }],
    } = await this.engine.dispatchJobs(null, [
      {
        target: { type: 'topic', key },
        values: Array.isArray(content) ? content : [content],
      },
    ]);

    return { connections: connections.map(toConnection) };
  }

  disconnect(
    connection: WebSocketConnection,
    reason?: string
  ): Promise<boolean> {
    return this._server.disconnect(connection, reason);
  }

  subscribeTopic(
    connection: WebSocketConnection,
    topic: string
  ): Promise<boolean> {
    return this._server.subscribeTopic(connection, topic);
  }

  unsubscribeTopic(
    connection: WebSocketConnection,
    topic: string
  ): Promise<boolean> {
    return this._server.unsubscribeTopic(connection, topic);
  }
}

export const BotP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    ServerP,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (server, moduleUtils, platformUtils) =>
    new WebSocketBot(
      server,
      moduleUtils?.initScope,
      platformUtils?.dispatchWrapper
    ),
})(WebSocketBot);

export type BotP = WebSocketBot;
