import { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import { makeClassProvider } from '@machinat/core/service';
import type {
  MachinatUser,
  PopEventWrapper,
  PopEventFn,
  PopErrorFn,
} from '@machinat/core/types';
import type { HttpRequestInfo, UpgradeHandler } from '@machinat/http/types';

import { WebSocketConnection } from './channel';
import { BotP } from './bot';
import { ServerP } from './server';
import createEvent from './utils/createEvent';
import { WEBSOCKET } from './constant';
import { PLATFORM_MOUNTER_I } from './interface';
import type {
  WebSocketEventContext,
  ConnectEventValue,
  DisconnectEventValue,
  EventInput,
} from './types';

/**
 * @category Provider
 */
export class WebSocketReceiver<User extends null | MachinatUser, Auth> {
  private _bot: BotP;
  private _server: ServerP<User, Auth>;

  private _popEvent: PopEventFn<WebSocketEventContext<any, any>, null>;
  private _popError: PopErrorFn;

  constructor(
    bot: BotP,
    server: ServerP<User, Auth>,
    popEventWrapper: PopEventWrapper<WebSocketEventContext<any, any>, null>,
    popError: PopErrorFn
  ) {
    this._bot = bot;
    this._server = server;

    this._popEvent = popEventWrapper(() => Promise.resolve(null));
    this._popError = popError;

    this._server.on('events', (values, { connId, user, socket, auth }) => {
      values.forEach((value) => {
        this._issueEvent(value, connId, user, socket.request, auth).catch(
          this._popError
        );
      });
    });

    this._server.on('connect', ({ connId, user, socket, auth }) => {
      const value: ConnectEventValue = {
        kind: 'connection',
        type: 'connect',
        payload: null,
      };

      this._issueEvent(value, connId, user, socket.request, auth).catch(
        this._popError
      );
    });

    this._server.on('disconnect', ({ reason }, ctx) => {
      const { connId, user, socket, auth } = ctx;
      const value: DisconnectEventValue = {
        kind: 'connection',
        type: 'disconnect',
        payload: { reason },
      };

      this._issueEvent(value, connId, user, socket.request, auth).catch(
        this._popError
      );
    });
  }

  async handleUpgrade(
    req: IncomingMessage,
    ns: NetSocket,
    head: Buffer
  ): Promise<void> {
    this._server.handleUpgrade(req, ns, head);
  }

  handleUpgradeCallback(): UpgradeHandler {
    return this.handleUpgrade.bind(this);
  }

  private async _issueEvent(
    value: EventInput,
    connId: string,
    user: User,
    request: HttpRequestInfo,
    auth: Auth
  ) {
    const channel = new WebSocketConnection(this._server.id, connId);
    await this._popEvent({
      platform: WEBSOCKET,
      bot: this._bot,
      event: createEvent(value, channel, user),
      metadata: {
        source: WEBSOCKET,
        request,
        connection: channel,
        auth,
      },
    });
  }
}

export const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BotP, ServerP, PLATFORM_MOUNTER_I] as const,
  factory: (bot, server, { popEventWrapper, popError }) =>
    new WebSocketReceiver(bot, server, popEventWrapper, popError),
})(WebSocketReceiver);

export type ReceiverP<
  User extends null | MachinatUser,
  Auth
> = WebSocketReceiver<User, Auth>;
