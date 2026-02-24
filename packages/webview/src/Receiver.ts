import type { PopEventWrapper, PopEventFn, PopErrorFn } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities.js';
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
import { WEBVIEW } from './constant.js';
import { WebviewSocketServer, PlatformUtilitiesI } from './interface.js';
import { SenderP } from './Sender.js';
import WebviewConnection from './Connection.js';
import createEvent from './utils/createEvent.js';
import { createThreadTopicKey, createUserTopicKey } from './utils/topicKey.js';
import type { WebviewEventContext } from './types.js';

/** @category Provider */
export class WebviewReceiver<
  Authenticator extends AnyServerAuthenticator,
  Value extends EventValue,
> {
  private _popEvent: PopEventFn<
    WebviewEventContext<Authenticator, Value>,
    null
  >;

  constructor(
    private _sender: SenderP,
    private _server: WebviewSocketServer<Authenticator>,
    popEventWrapper: PopEventWrapper<
      WebviewEventContext<Authenticator, Value>,
      null
    >,
    private _popError: PopErrorFn,
  ) {
    this._popEvent = popEventWrapper(() => Promise.resolve(null));

    this._server.on(
      'events',
      (values, { connId, user, request, authContext }) => {
        values.forEach((value) => {
          const connection = new WebviewConnection(this._server.id, connId);
          this._issueEvent(value, connection, user, request, authContext);
        });
      },
    );

    this._server.on('connect', ({ connId, user, request, authContext }) => {
      const value: ConnectEventValue = {
        kind: 'connection',
        type: 'connect',
        payload: null,
      };

      const connection = new WebviewConnection(this._server.id, connId);
      if (authContext.user) {
        this._server.subscribeTopic(
          connection,
          createUserTopicKey(authContext.user),
        );
      }
      if (authContext.thread) {
        this._server.subscribeTopic(
          connection,
          createThreadTopicKey(authContext.thread),
        );
      }

      this._issueEvent(value, connection, user, request, authContext);
    });

    this._server.on('disconnect', ({ reason }, connData) => {
      const { connId, user, request, authContext } = connData;
      const value: DisconnectEventValue = {
        kind: 'connection',
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
    authContext: ContextOfAuthenticator<Authenticator>,
  ) {
    this._popEvent({
      platform: WEBVIEW,
      sender: this._sender,
      event: createEvent(value, connection, user),
      metadata: {
        source: 'websocket',
        request,
        connection,
        auth: authContext,
      },
      reply: (message) => this._sender.render(connection, message),
    }).catch(this._popError);
  }
}

export const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [SenderP, WebSocket.Server, ModuleUtilitiesI, PlatformUtilitiesI],
  factory: (sender, server, { popError }, { popEventWrapper }) =>
    new WebviewReceiver(
      sender,
      server as WebviewSocketServer<AnyServerAuthenticator>,
      popEventWrapper,
      popError,
    ),
})(WebviewReceiver);

export type ReceiverP<
  Authenticator extends AnyServerAuthenticator,
  Value extends EventValue,
> = WebviewReceiver<Authenticator, Value>;
