import { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import { makeClassProvider } from '@machinat/core/service';
import type {
  PopEventWrapper,
  PopEventFn,
  PopErrorFn,
} from '@machinat/core/types';
import {
  AnyServerAuthorizer,
  UserOfAuthorizer,
  ContextOfAuthorizer,
} from '@machinat/auth/types';
import type { HttpRequestInfo, UpgradeHandler } from '@machinat/http/types';
import {
  EventInput,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '@machinat/websocket/types';

import { WEBVIEW } from './constant';
import { SocketServerP, PLATFORM_MOUNTER_I } from './interface';
import { BotP } from './bot';
import { WebviewConnection } from './channel';
import { createEvent } from './utils';
import type { WebviewEventContext } from './types';

/**
 * @category Provider
 */
export class WebviewReceiver<
  Authorizer extends AnyServerAuthorizer,
  Value extends EventValue = EventValue
> {
  private _bot: BotP<Authorizer>;
  private _server: SocketServerP<Authorizer>;

  private _popEvent: PopEventFn<WebviewEventContext<Authorizer, Value>, null>;
  private _popError: PopErrorFn;

  constructor(
    bot: BotP<Authorizer>,
    server: SocketServerP<Authorizer>,
    popEventWrapper: PopEventWrapper<WebviewEventContext<Authorizer>, null>,
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

    this._server.on('disconnect', ({ reason }, connData) => {
      const { connId, user, socket, auth } = connData;
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
    user: UserOfAuthorizer<Authorizer>,
    request: HttpRequestInfo,
    authContext: ContextOfAuthorizer<Authorizer>
  ) {
    const channel = new WebviewConnection(this._server.id, connId);
    await this._popEvent({
      platform: WEBVIEW,
      bot: this._bot,
      event: createEvent(value, channel, user),
      metadata: {
        source: 'websocket',
        request,
        connection: channel,
        auth: authContext,
      },
    });
  }
}

export const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BotP, SocketServerP, PLATFORM_MOUNTER_I] as const,
  factory: (bot, server, { popEventWrapper, popError }) =>
    new WebviewReceiver(bot, server, popEventWrapper, popError),
})(WebviewReceiver);

export type ReceiverP<
  Authorizer extends AnyServerAuthorizer,
  Value extends EventValue = EventValue
> = WebviewReceiver<Authorizer, Value>;
