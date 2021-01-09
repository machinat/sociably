// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import AuthClient from '@machinat/auth/client';
import { ClientAuthorizer } from '@machinat/auth/types';
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

type AnyClientAuthorizer = ClientAuthorizer<any, any, unknown, unknown>;

type UserOf<
  Authorizer extends AnyClientAuthorizer
> = Authorizer extends ClientAuthorizer<infer User, any, unknown, unknown>
  ? User
  : never;

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
  Value extends EventValue<string, string, unknown> = EventValue<
    string,
    string,
    unknown
  >
> extends Emitter<[WebviewEvent<Value, UserOf<Authorizer>>]> {
  private _connector: WebSocketConnector<UserOf<Authorizer>>;
  private _authClient: AuthClient<Authorizer>;

  private _user: null | UserOf<Authorizer>;
  private _channel: null | WebviewConnection;

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
      serverURL: authUrl || '/auth',
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
      this._emitEvent(createEvent(connectEvent, this._channel, user));
    });

    this._connector.on('events', (values) => {
      for (const value of values) {
        this._emitEvent(
          createEvent(
            value,
            this._channel as WebviewConnection,
            this._user as UserOf<Authorizer>
          )
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
          this._user as UserOf<Authorizer>
        )
      );
    });

    this._connector.on('error', this._emitError.bind(this));

    this._connector.start().catch(this._emitError.bind(this));
  }

  get isConnected(): boolean {
    return this._connector.isConnected();
  }

  get user(): null | UserOf<Authorizer> {
    return this._user;
  }

  get channel(): null | WebviewConnection {
    return this._channel;
  }

  async send(...events: EventInput[]): Promise<void> {
    await this._connector.send(...events);
  }

  disconnect(reason: string): void {
    this._connector.disconnect(reason);
  }

  private async _getLoginAuth(): Promise<{
    user: UserOf<Authorizer>;
    credential: string;
  }> {
    const { token, context } = await this._authClient.auth();
    return { user: context.user, credential: token };
  }
}

export default WebviewClient;
