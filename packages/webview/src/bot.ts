import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import { makeClassProvider, createEmptyScope } from '@machinat/core/service';
import type {
  MachinatNode,
  MachinatBot,
  MachinatUser,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core/types';
import type { DispatchResponse } from '@machinat/core/engine/types';
import type { AnyServerAuthorizer } from '@machinat/auth/types';
import { WebSocketWorker } from '@machinat/websocket';
import createJobs from '@machinat/websocket/utils/createJobs';
import type {
  EventInput,
  WebSocketJob,
  WebSocketResult,
} from '@machinat/websocket/types';
import { WEBVIEW } from './constant';
import { SocketServerP, PLATFORM_MOUNTER_I } from './interface';
import {
  WebviewTopicChannel,
  WebviewUserChannel,
  WebviewConnection,
} from './channel';
import type { WebviewDispatchFrame, WebviewComponent } from './types';

type WebSocketDispatchResponse = DispatchResponse<
  WebSocketJob,
  WebSocketResult
>;

/**
 * @category Provider
 */
export class WebviewBot<Authorizer extends AnyServerAuthorizer>
  implements
    MachinatBot<
      WebviewTopicChannel | WebviewUserChannel | WebviewConnection,
      WebSocketJob,
      WebSocketResult
    > {
  private _server: SocketServerP<Authorizer>;

  engine: Engine<
    WebviewTopicChannel | WebviewUserChannel | WebviewConnection,
    EventInput,
    WebviewComponent,
    WebSocketJob,
    WebSocketResult,
    WebviewBot<Authorizer>
  >;

  constructor(
    server: SocketServerP<Authorizer>,
    initScope: InitScopeFn = () => createEmptyScope(WEBVIEW),
    dispatchWrapper: DispatchWrapper<
      WebSocketJob,
      WebviewDispatchFrame<Authorizer>,
      WebSocketResult
    > = (dispatch) => dispatch
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
      this,
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
    channel: WebviewConnection | WebviewUserChannel | WebviewTopicChannel,
    message: MachinatNode
  ): Promise<null | WebSocketDispatchResponse> {
    return this.engine.render(channel, message, createJobs);
  }

  async send(
    channel: WebviewConnection,
    event: EventInput
  ): Promise<WebSocketResult> {
    const response = await this.engine.dispatchJobs(channel, [
      { target: channel, events: [event] },
    ]);

    return response.results[0];
  }

  async sendUser(
    user: MachinatUser,
    event: EventInput
  ): Promise<WebSocketResult> {
    const channel = new WebviewUserChannel(user.uid);
    const response = await this.engine.dispatchJobs(channel, [
      { target: channel, events: [event] },
    ]);

    return response.results[0];
  }

  async sendTopic(topic: string, event: EventInput): Promise<WebSocketResult> {
    const channel = new WebviewTopicChannel(topic);
    const response = await this.engine.dispatchJobs(channel, [
      { target: channel, events: [event] },
    ]);

    return response.results[0];
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
    { require: PLATFORM_MOUNTER_I, optional: true },
  ] as const,
  factory: (server, mounter) =>
    new WebviewBot(server, mounter?.initScope, mounter?.dispatchWrapper),
})(WebviewBot);

export type BotP<Authorizer extends AnyServerAuthorizer> = WebviewBot<
  Authorizer
>;
