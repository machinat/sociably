import type {
  SociablyUser,
  PopEventWrapper,
  PopEventFn,
  PopErrorFn,
} from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities.js';
import type { HttpRequestInfo } from '@sociably/http';

import WebSocketConnection from './Connection.js';
import { SenderP } from './Sender.js';
import { ServerP } from './Server.js';
import createEvent from './utils/createEvent.js';
import { WEBSOCKET } from './constant.js';
import { PlatformUtilitiesI } from './interface.js';
import type {
  WebSocketEventContext,
  ConnectEventValue,
  DisconnectEventValue,
  EventInput,
} from './types.js';

/** @kind Provider */
export class WebSocketReceiver<User extends null | SociablyUser, Auth> {
  private _popEvent: PopEventFn<WebSocketEventContext<any, any>, null>;

  constructor(
    private _sender: SenderP,
    private _server: ServerP<User, Auth>,
    popEventWrapper: PopEventWrapper<WebSocketEventContext<any, any>, null>,
    private _popError: PopErrorFn,
  ) {
    this._popEvent = popEventWrapper(() => Promise.resolve(null));

    this._server.on(
      'events',
      (values, { connId, user, request, authContext }) => {
        values.forEach((value) => {
          this._issueEvent(value, connId, user, request, authContext).catch(
            this._popError,
          );
        });
      },
    );

    this._server.on('connect', ({ connId, user, request, authContext }) => {
      const value: ConnectEventValue = {
        kind: 'connection',
        type: 'connect',
        payload: null,
      };

      this._issueEvent(value, connId, user, request, authContext).catch(
        this._popError,
      );
    });

    this._server.on('disconnect', ({ reason }, ctx) => {
      const { connId, user, request, authContext } = ctx;
      const value: DisconnectEventValue = {
        kind: 'connection',
        type: 'disconnect',
        payload: { reason },
      };

      this._issueEvent(value, connId, user, request, authContext).catch(
        this._popError,
      );
    });

    this._server.on('error', (err: Error) => {
      this._popError(err);
    });
  }

  private async _issueEvent(
    value: EventInput,
    connId: string,
    user: User,
    request: HttpRequestInfo,
    auth: Auth,
  ) {
    const thread = new WebSocketConnection(this._server.id, connId);
    await this._popEvent({
      platform: WEBSOCKET,
      sender: this._sender,
      event: createEvent(value, thread, user),
      metadata: {
        source: WEBSOCKET,
        request,
        connection: thread,
        auth,
      },
      reply: (message) => this._sender.render(thread, message),
    });
  }
}

export const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [SenderP, ServerP, ModuleUtilitiesI, PlatformUtilitiesI],
  factory: (sender, server, { popError }, { popEventWrapper }) =>
    new WebSocketReceiver(sender, server, popEventWrapper, popError),
})(WebSocketReceiver);

export type ReceiverP<
  User extends null | SociablyUser,
  Auth,
> = WebSocketReceiver<User, Auth>;
