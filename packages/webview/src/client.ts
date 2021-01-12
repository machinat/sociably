// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import AuthClient from '@machinat/auth/client';
import {
  AnyClientAuthorizer,
  UserOfAuthorizer,
  ContextOfAuthorizer,
} from '@machinat/auth/types';
import type {
  EventInput,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '@machinat/websocket/types';
import WebSocketConnector from '@machinat/websocket/client/Connector';
import Emitter from '@machinat/websocket/client/Emitter';
import { WebviewConnection } from './channel';
import { createEvent } from './utils';
import { WebviewEvent } from './types';

type ClientOptions<Authorizer extends AnyClientAuthorizer> = {
  /** URL string to connect WebSocket backend. Default to `"/websocket"` */
  webSocketUrl?: string;
  /** Secify the platform to ligin. Default to the `platform` querystring param */
  platform?: string;
  /** URL string to connect auth backend. Default to `"/auth"` */
  authUrl?: string;
  /** Authorizer of available platforms. */
  authorizers: Authorizer[];
};

class WebviewClient<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue = EventValue
> extends Emitter<
  [
    WebviewEvent<Value, UserOfAuthorizer<Authorizer>>,
    ContextOfAuthorizer<Authorizer>
  ]
> {
  private _authClient: AuthClient<Authorizer>;
  private _connector: WebSocketConnector<UserOfAuthorizer<Authorizer>>;

  private _user: null | UserOfAuthorizer<Authorizer>;
  private _channel: null | WebviewConnection;

  get isConnected(): boolean {
    return this._connector.isConnected();
  }

  get user(): null | UserOfAuthorizer<Authorizer> {
    return this._user;
  }

  get channel(): null | WebviewConnection {
    return this._channel;
  }

  get authContext(): null | ContextOfAuthorizer<Authorizer> {
    return this._authClient.getAuthContext();
  }

  constructor({
    webSocketUrl,
    platform,
    authorizers,
    authUrl,
  }: ClientOptions<Authorizer>) {
    super();

    this._user = null;
    this._channel = null;

    this._authClient = new AuthClient({
      platform,
      authorizers,
      serverUrl: authUrl || '/auth',
    });

    this._connector = new WebSocketConnector(
      webSocketUrl || '/websocket',
      this._getLoginAuth.bind(this)
    );

    this._connector.on('connect', ({ connId, user }) => {
      this._user = user;
      this._channel = new WebviewConnection('*', connId);

      const connectEvent: ConnectEventValue = {
        kind: 'connection',
        type: 'connect',
        payload: null,
      };
      this._emitEvent(
        createEvent(connectEvent, this._channel, user),
        this.authContext as ContextOfAuthorizer<Authorizer>
      );
    });

    this._connector.on('events', (values) => {
      for (const value of values) {
        this._emitEvent(
          createEvent(
            value,
            this._channel as WebviewConnection,
            this._user as UserOfAuthorizer<Authorizer>
          ),
          this.authContext as ContextOfAuthorizer<Authorizer>
        );
      }
    });

    this._connector.on('disconnect', ({ reason }) => {
      const channel = this._channel;
      this._channel = null;

      const disconnectValue: DisconnectEventValue = {
        kind: 'connection',
        type: 'disconnect',
        payload: { reason },
      };

      this._emitEvent(
        createEvent(
          disconnectValue,
          channel as WebviewConnection,
          this._user as UserOfAuthorizer<Authorizer>
        ),
        this.authContext as ContextOfAuthorizer<Authorizer>
      );
    });

    this._connector.on('error', this._emitError.bind(this));

    this._connector.start().catch(this._emitError.bind(this));
  }

  async send(...events: EventInput[]): Promise<void> {
    await this._connector.send(...events);
  }

  disconnect(reason: string): void {
    this._connector.disconnect(reason);
  }

  private async _getLoginAuth(): Promise<{
    user: UserOfAuthorizer<Authorizer>;
    credential: string;
  }> {
    const { token, context } = await this._authClient.auth();
    return {
      user: context.user as UserOfAuthorizer<Authorizer>,
      credential: token,
    };
  }
}

export default WebviewClient;