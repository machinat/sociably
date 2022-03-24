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
import ModuleUtilitiesI from '@machinat/core/base/ModuleUtilities';
import { makeClassProvider } from '@machinat/core/service';

import { WEBSOCKET } from './constant';
import { PlatformUtilitiesI } from './interface';
import { ServerP } from './server';
import {
  WebSocketConnection,
  WebSocketTopicChannel,
  WebSocketUserChannel,
} from './channel';
import createJobs from './utils/createJobs';
import WebSocketWorker from './worker';
import type {
  EventInput,
  WebSocketJob,
  WebSocketResult,
  WebSocketComponent,
  WebSocketDispatchFrame,
  ConnIdentifier,
  WebSocketDispatchChannel,
  WebSocketDispatchResponse,
} from './types';

type SendResult = {
  connections: WebSocketConnection[];
};

const toConnection = ({ serverId, id }: ConnIdentifier) =>
  new WebSocketConnection(serverId, id);

/**
 * @category Provider
 */
export class WebSocketBot
  implements
    MachinatBot<WebSocketDispatchChannel, WebSocketJob, WebSocketResult>
{
  private _server: ServerP<any, unknown>;
  engine: Engine<
    WebSocketDispatchChannel,
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
    channel: WebSocketDispatchChannel,
    message: MachinatNode
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render<WebSocketDispatchChannel>(
      channel,
      message,
      createJobs
    );
  }

  async send(
    channel: WebSocketConnection,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const {
      results: [{ connections }],
    } = await this.engine.dispatchJobs(channel, [
      {
        target: channel,
        values: Array.isArray(content) ? content : [content],
      },
    ]);

    return { connections: connections.map(toConnection) };
  }

  async sendUser(
    user: MachinatUser,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const channel = new WebSocketUserChannel(user.uid);
    const {
      results: [{ connections }],
    } = await this.engine.dispatchJobs(channel, [
      {
        target: channel,
        values: Array.isArray(content) ? content : [content],
      },
    ]);

    return { connections: connections.map(toConnection) };
  }

  async sendTopic(
    topic: string,
    content: EventInput | EventInput[]
  ): Promise<SendResult> {
    const channel = new WebSocketTopicChannel(topic);
    const {
      results: [{ connections }],
    } = await this.engine.dispatchJobs(channel, [
      {
        target: channel,
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

export const BotP = makeClassProvider({
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
