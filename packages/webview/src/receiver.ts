import type { PopEventWrapper, PopEventFn, PopErrorFn } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import {
  AnyServerAuthenticator,
  UserOfAuthenticator,
  ContextOfAuthenticator,
} from '@sociably/auth';
import type { HttpRequestInfo } from '@sociably/http';
import WebSocket, {
  EventInput,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '@sociably/websocket';
import { WEBVIEW } from './constant';
import { WebviewSocketServer, PlatformUtilitiesI } from './interface';
import { BotP } from './Bot';
import WebviewConnection from './Connection';
import createEvent from './utils/createEvent';
import { createThreadTopicKey, createUserTopicKey } from './utils/topicKey';
import type { WebviewEventContext } from './types';

/**
 * @category Provider
 */
export class WebviewReceiver<
  Authenticator extends AnyServerAuthenticator,
  Value extends EventValue
> {
  private _bot: BotP;
  private _server: WebviewSocketServer<Authenticator>;

  private _popError: PopErrorFn;
  private _popEvent: PopEventFn<
    WebviewEventContext<Authenticator, Value>,
    null
  >;

  constructor(
    bot: BotP,
    server: WebviewSocketServer<Authenticator>,
    popEventWrapper: PopEventWrapper<
      WebviewEventContext<Authenticator, Value>,
      null
    >,
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
          const connection = new WebviewConnection(this._server.id, connId);
          this._issueEvent(value, connection, user, request, authContext);
        });
      }
    );

    this._server.on('connect', ({ connId, user, request, authContext }) => {
      const value: ConnectEventValue = {
        category: 'connection',
        type: 'connect',
        payload: null,
      };

      const connection = new WebviewConnection(this._server.id, connId);
      if (authContext.user) {
        this._server.subscribeTopic(
          connection,
          createUserTopicKey(authContext.user)
        );
      }
      if (authContext.thread) {
        this._server.subscribeTopic(
          connection,
          createThreadTopicKey(authContext.thread)
        );
      }

      this._issueEvent(value, connection, user, request, authContext);
    });

    this._server.on('disconnect', ({ reason }, connData) => {
      const { connId, user, request, authContext } = connData;
      const value: DisconnectEventValue = {
        category: 'connection',
        type: 'disconnect',
        payload: { reason },
      };

      const connection = new WebviewConnection(this._server.id, connId);
      this._issueEvent(value, connection, user, request, authContext);
    });

    this._server.on('error', (err: Error) => {
      this._popError(err);
    });
  }

  private _issueEvent(
    value: EventInput,
    connection: WebviewConnection,
    user: UserOfAuthenticator<Authenticator>,
    request: HttpRequestInfo,
    authContext: ContextOfAuthenticator<Authenticator>
  ) {
    this._popEvent({
      platform: WEBVIEW,
      bot: this._bot,
      event: createEvent(value, connection, user),
      metadata: {
        source: 'websocket',
        request,
        connection,
        auth: authContext,
      },
      reply: (message) => this._bot.render(connection, message),
    }).catch(this._popError);
  }
}

export const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [BotP, WebSocket.Server, ModuleUtilitiesI, PlatformUtilitiesI],
  factory: (
    bot,
    server: WebviewSocketServer<AnyServerAuthenticator>,
    { popError },
    { popEventWrapper }
  ) => new WebviewReceiver(bot, server, popEventWrapper, popError),
})(WebviewReceiver);

export type ReceiverP<
  Authenticator extends AnyServerAuthenticator,
  Value extends EventValue
> = WebviewReceiver<Authenticator, Value>;
