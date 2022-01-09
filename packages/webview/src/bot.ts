import type {
  MachinatNode,
  MachinatBot,
  MachinatUser,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core';
import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import { makeClassProvider } from '@machinat/core/service';
import ModuleUtilitiesI from '@machinat/core/base/ModuleUtilities';
import type { DispatchResponse } from '@machinat/core/engine';
import type { AnyServerAuthenticator } from '@machinat/auth';
import { WebSocketWorker } from '@machinat/websocket';
import { createJobs } from '@machinat/websocket/utils';
import type {
  EventInput,
  WebSocketJob,
  WebSocketResult,
  ConnIdentifier,
} from '@machinat/websocket';
import { WEBVIEW } from './constant';
import { SocketServerP, PlatformUtilitiesI } from './interface';
import {
  WebviewConnection,
  WebviewTopicChannel,
  WebviewUserChannel,
} from './channel';
import type {
  WebviewDispatchFrame,
  WebviewComponent,
  WebviewDispatchChannel,
} from './types';

type WebSocketDispatchResponse = DispatchResponse<
  WebSocketJob,
  WebSocketResult
>;

type SendResult = {
  connections: WebviewConnection[];
};

const toConnection = ({ serverId, id }: ConnIdentifier): WebviewConnection =>
  new WebviewConnection(serverId, id);

/**
 * @category Provider
 */
export class WebviewBot<Authenticator extends AnyServerAuthenticator>
  implements MachinatBot<WebviewDispatchChannel, WebSocketJob, WebSocketResult>
{
  private _server: SocketServerP<Authenticator>;

  engine: Engine<
    WebviewDispatchChannel,
    EventInput,
    WebviewComponent,
    WebSocketJob,
    WebSocketResult
  >;

  constructor(
    server: SocketServerP<Authenticator>,
    initScope?: InitScopeFn,
    dispatchWrapper?: DispatchWrapper<
      WebSocketJob,
      WebviewDispatchFrame,
      WebSocketResult
    >
  ) {
    this._server = server;

    const queue = new Queue<WebSocketJob, WebSocketResult>();
    const worker = new WebSocketWorker(server);

    const renderer = new Renderer<EventInput, WebviewComponent>(WEBVIEW, () => {
      throw new TypeError(
        'general component not supported at websocket platform'
      );
    });

    this.engine = new Engine(
      WEBVIEW,
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
    channel: WebviewDispatchChannel,
    message: MachinatNode
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render<WebviewDispatchChannel>(
      channel,
      message,
      createJobs
    );
  }

  async send(
    channel: WebviewConnection,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const response = await this.engine.dispatchJobs(channel, [
      { target: channel, values: Array.isArray(content) ? content : [content] },
    ]);

    return {
      connections: response.results[0].connections.map(toConnection),
    };
  }

  async sendUser(
    user: MachinatUser,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const channel = new WebviewUserChannel(user.uid);
    const response = await this.engine.dispatchJobs(channel, [
      { target: channel, values: Array.isArray(content) ? content : [content] },
    ]);

    return {
      connections: response.results[0].connections.map(toConnection),
    };
  }

  async sendTopic(
    topic: string,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const channel = new WebviewTopicChannel(topic);
    const response = await this.engine.dispatchJobs(channel, [
      { target: channel, values: Array.isArray(content) ? content : [content] },
    ]);

    return {
      connections: response.results[0].connections.map(toConnection),
    };
  }

  disconnect(connection: WebviewConnection, reason?: string): Promise<boolean> {
    return this._server.disconnect(connection, reason);
  }

  subscribeTopic(
    connection: WebviewConnection,
    topic: string
  ): Promise<boolean> {
    return this._server.subscribeTopic(connection, topic);
  }

  unsubscribeTopic(
    connection: WebviewConnection,
    topic: string
  ): Promise<boolean> {
    return this._server.unsubscribeTopic(connection, topic);
  }
}

export const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    SocketServerP,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ] as const,
  factory: (server, moduleUitils, platformUtils) =>
    new WebviewBot(
      server,
      moduleUitils?.initScope,
      platformUtils?.dispatchWrapper
    ),
})(WebviewBot);

export type BotP<Authenticator extends AnyServerAuthenticator> =
  WebviewBot<Authenticator>;
