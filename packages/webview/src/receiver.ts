import type { PopEventWrapper, PopEventFn, PopErrorFn } from '@machinat/core';
import { makeClassProvider } from '@machinat/core/service';
import ModuleUtilitiesI from '@machinat/core/base/ModuleUtilities';
import {
  AnyServerAuthenticator,
  UserOfAuthenticator,
  ContextOfAuthenticator,
} from '@machinat/auth';
import type { HttpRequestInfo } from '@machinat/http';
import {
  EventInput,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '@machinat/websocket';

import { WEBVIEW } from './constant';
import { SocketServerP, PlatformUtilitiesI } from './interface';
import { BotP } from './bot';
import { WebviewConnection } from './channel';
import { createEvent } from './utils';
import type { WebviewEventContext } from './types';

/**
 * @category Provider
 */
export class WebviewReceiver<
  Authenticator extends AnyServerAuthenticator,
  Value extends EventValue = EventValue
> {
  private _bot: BotP<Authenticator>;
  private _server: SocketServerP<Authenticator>;

  private _popEvent: PopEventFn<
    WebviewEventContext<Authenticator, Value>,
    null
  >;

  private _popError: PopErrorFn;

  constructor(
    bot: BotP<Authenticator>,
    server: SocketServerP<Authenticator>,
    popEventWrapper: PopEventWrapper<WebviewEventContext<Authenticator>, null>,
    popError: PopErrorFn
  ) {
    this._bot = bot;
    this._server = server;

    this._popEvent = popEventWrapper(() => Promise.resolve(null));
    this._popError = popError;

    this._server.on(
      'events',
      (values, { connId, user, request, authContext }) => {
        values.forEach((value) => {
          this._issueEvent(value, connId, user, request, authContext);
        });
      }
    );

    this._server.on('connect', ({ connId, user, request, authContext }) => {
      const value: ConnectEventValue = {
        category: 'connection',
        type: 'connect',
        payload: null,
      };
      this._issueEvent(value, connId, user, request, authContext);
    });

    this._server.on('disconnect', ({ reason }, connData) => {
      const { connId, user, request, authContext } = connData;
      const value: DisconnectEventValue = {
        category: 'connection',
        type: 'disconnect',
        payload: { reason },
      };

      this._issueEvent(value, connId, user, request, authContext);
    });

    this._server.on('error', (err: Error) => {
      this._popError(err);
    });
  }

  private _issueEvent(
    value: EventInput,
    connId: string,
    user: UserOfAuthenticator<Authenticator>,
    request: HttpRequestInfo,
    authContext: ContextOfAuthenticator<Authenticator>
  ) {
    const channel = new WebviewConnection(this._server.id, connId);
    this._popEvent({
      platform: WEBVIEW,
      bot: this._bot,
      event: createEvent(value, channel, user),
      metadata: {
        source: 'websocket',
        request,
        connection: channel,
        auth: authContext,
      },
      reply: (message) => this._bot.render(channel, message),
    }).catch(this._popError);
  }
}

export const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BotP, SocketServerP, ModuleUtilitiesI, PlatformUtilitiesI],
  factory: (bot, server, { popError }, { popEventWrapper }) =>
    new WebviewReceiver(bot, server, popEventWrapper, popError),
})(WebviewReceiver);

export type ReceiverP<
  Authenticator extends AnyServerAuthenticator,
  Value extends EventValue = EventValue
> = WebviewReceiver<Authenticator, Value>;
