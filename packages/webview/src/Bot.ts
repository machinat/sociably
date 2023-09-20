import type {
  SociablyNode,
  SociablyBot,
  SociablyUser,
  InitScopeFn,
  DispatchWrapper,
  SociablyThread,
} from '@sociably/core';
import Engine from '@sociably/core/engine';
import Renderer from '@sociably/core/renderer';
import Queue from '@sociably/core/queue';
import { serviceProviderClass } from '@sociably/core/service';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import type { DispatchResponse } from '@sociably/core/engine';
import type { AnyServerAuthenticator } from '@sociably/auth';
import WebSocket, { WebSocketWorker } from '@sociably/websocket';
import { createJobs } from '@sociably/websocket/utils';
import type {
  EventInput,
  WebSocketJob,
  WebSocketResult,
  ConnIdentifier,
} from '@sociably/websocket';
import { WEBVIEW } from './constant.js';
import { WebviewSocketServer, PlatformUtilitiesI } from './interface.js';
import WebviewConnection from './Connection.js';
import { createThreadTopicKey, createUserTopicKey } from './utils/topicKey.js';
import type { WebviewDispatchFrame, WebviewComponent } from './types.js';

type WebSocketDispatchResponse = DispatchResponse<
  WebSocketJob,
  WebSocketResult
>;

type SendResult = {
  connections: WebviewConnection[];
};

const toConnection = ({ serverId, id }: ConnIdentifier): WebviewConnection =>
  new WebviewConnection(serverId, id);

/** @category Provider */
export class WebviewBot
  implements SociablyBot<WebviewConnection, WebSocketJob, WebSocketResult>
{
  private _server: WebviewSocketServer<AnyServerAuthenticator>;
  engine: Engine<
    WebviewConnection,
    EventInput,
    WebviewComponent,
    WebSocketJob,
    WebSocketResult
  >;

  platform = WEBVIEW;

  constructor(
    server: WebviewSocketServer<AnyServerAuthenticator>,
    initScope?: InitScopeFn,
    dispatchWrapper?: DispatchWrapper<
      WebSocketJob,
      WebviewDispatchFrame,
      WebSocketResult
    >,
  ) {
    this._server = server;

    const queue = new Queue<WebSocketJob, WebSocketResult>();
    const worker = new WebSocketWorker(server);

    const renderer = new Renderer<EventInput, WebviewComponent>(WEBVIEW, () => {
      throw new TypeError(
        'general component not supported at websocket platform',
      );
    });

    this.engine = new Engine(
      WEBVIEW,
      renderer,
      queue,
      worker,
      initScope,
      dispatchWrapper,
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
    thread: WebviewConnection,
    message: SociablyNode,
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render<WebviewConnection>(thread, message, createJobs);
  }

  async send(
    thread: WebviewConnection,
    content: EventInput | EventInput[],
  ): Promise<SendResult> {
    const response = await this.engine.dispatchJobs(thread, [
      { target: thread, values: Array.isArray(content) ? content : [content] },
    ]);

    return {
      connections: response.results[0].connections.map(toConnection),
    };
  }

  async sendTopic(
    topicKey: string,
    content: EventInput | EventInput[],
  ): Promise<SendResult> {
    const response = await this.engine.dispatchJobs(null, [
      {
        target: { type: 'topic', key: topicKey },
        values: Array.isArray(content) ? content : [content],
      },
    ]);

    return {
      connections: response.results[0].connections.map(toConnection),
    };
  }

  async sendUser(
    user: SociablyUser,
    content: EventInput | EventInput[],
  ): Promise<SendResult> {
    return this.sendTopic(createUserTopicKey(user), content);
  }

  async sendThread(
    thread: SociablyThread,
    content: EventInput | EventInput[],
  ): Promise<SendResult> {
    return this.sendTopic(createThreadTopicKey(thread), content);
  }

  disconnect(connection: WebviewConnection, reason?: string): Promise<boolean> {
    return this._server.disconnect(connection, reason);
  }

  subscribeTopic(
    connection: WebviewConnection,
    topic: string,
  ): Promise<boolean> {
    return this._server.subscribeTopic(connection, topic);
  }

  unsubscribeTopic(
    connection: WebviewConnection,
    topic: string,
  ): Promise<boolean> {
    return this._server.unsubscribeTopic(connection, topic);
  }
}

export const BotP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    WebSocket.Server,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    server: WebviewSocketServer<AnyServerAuthenticator>,
    moduleUitils,
    platformUtils,
  ) =>
    new WebviewBot(
      server,
      moduleUitils?.initScope,
      platformUtils?.dispatchWrapper,
    ),
})(WebviewBot);

export type BotP = WebviewBot;
