// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import { AnyMarshalType, BaseMarshaler } from '@machinat/core/base/Marshaler';
import AuthClient from '@machinat/auth/client';
import type { UserOfAuthorizer, ContextOfAuthorizer } from '@machinat/auth';
import type {
  EventInput,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '@machinat/websocket';
import { Connector, ClientEmitter } from '@machinat/websocket/client';
import { DEFAULT_AUTH_PATH, DEFAULT_WEBSOCKET_PATH } from '../constant';
import { WebviewConnection } from '../channel';
import { createEvent } from '../utils';
import type { WebviewEvent, AnyClientAuthorizer } from '../types';

type ClientOptions<Authorizer extends AnyClientAuthorizer> = {
  /** URL string to connect WebSocket backend. Default to `"/websocket"` */
  webSocketUrl?: string;
  /** Secify the platform to ligin. Default to the `platform` querystring param */
  platform?: string;
  /** URL string to connect auth backend. Default to `"/auth"` */
  authUrl?: string;
  /** Authorizer of available platforms. */
  authorizers: Authorizer[];
  /**
   * When set to true, the underlying socket will not really connecct. It is
   * useful for server rendering at server side.
   */
  mockupMode?: boolean;
};

export type ClientEventContext<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue
> = {
  platform: string;
  event: WebviewEvent<Value, UserOfAuthorizer<Authorizer>>;
  authorizer: Authorizer;
  auth: ContextOfAuthorizer<Authorizer>;
};

export type ClientEventContextOfAuthorizer<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue
> = Authorizer extends AnyClientAuthorizer
  ? {
      platform: Authorizer['platform'];
      event: WebviewEvent<Value, UserOfAuthorizer<Authorizer>>;
      authorizer: Authorizer;
      auth: ContextOfAuthorizer<Authorizer>;
    }
  : never;

class WebviewClient<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue = EventValue
> extends ClientEmitter<ClientEventContextOfAuthorizer<Authorizer, Value>> {
  private _authClient: AuthClient<Authorizer>;
  private _connector: Connector<UserOfAuthorizer<Authorizer>>;
  private _platformInput: string | undefined;

  private _user: null | UserOfAuthorizer<Authorizer>;
  private _channel: null | WebviewConnection;

  isMockupMode: boolean;

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

  get platform(): string | undefined {
    return this._authClient.platform;
  }

  constructor({
    webSocketUrl,
    platform,
    authorizers,
    authUrl,
    mockupMode = false,
  }: ClientOptions<Authorizer>) {
    super();

    this._user = null;
    this._channel = null;
    this.isMockupMode = mockupMode;
    this._platformInput = platform;

    this._authClient = new AuthClient({
      authorizers,
      serverUrl: authUrl || DEFAULT_AUTH_PATH,
    });

    const marshalTypes = authorizers.reduce((types, authorizer) => {
      if (authorizer.marshalTypes) {
        types.push(...authorizer.marshalTypes);
      }
      return types;
    }, [] as AnyMarshalType[]);

    const { host, pathname } = window.location;
    const socketServerUrl = new URL(
      webSocketUrl || DEFAULT_WEBSOCKET_PATH,
      `wss://${host}${pathname}`
    ).href;

    this._connector = this._initConnector(socketServerUrl, marshalTypes);
    if (!this.isMockupMode) {
      this._connector.start().catch(this._emitError.bind(this));
    }
  }

  async send(content: EventInput | EventInput[]): Promise<void> {
    await this._connector.send(Array.isArray(content) ? content : [content]);
  }

  disconnect(reason: string): void {
    this._connector.disconnect(reason);
  }

  private async _getLoginAuth(): Promise<{
    user: UserOfAuthorizer<Authorizer>;
    credential: string;
  }> {
    const { token, context } = await this._authClient.signIn({
      platform: this._platformInput,
    });
    return {
      user: context.user as UserOfAuthorizer<Authorizer>,
      credential: token,
    };
  }

  private _initConnector(
    socketServerUrl: string,
    marshalTypes: AnyMarshalType[]
  ): Connector<UserOfAuthorizer<Authorizer>> {
    return new Connector<UserOfAuthorizer<Authorizer>>(
      socketServerUrl,
      this._getLoginAuth.bind(this),
      new BaseMarshaler(marshalTypes)
    )
      .on('connect', ({ connId, user }) => {
        this._user = user;
        this._channel = new WebviewConnection('*', connId);

        const connectEvent: ConnectEventValue = {
          category: 'connection',
          type: 'connect',
          payload: null,
        };

        this._emitEvent({
          event: createEvent(connectEvent, this._channel, user),
          auth: this.authContext as ContextOfAuthorizer<Authorizer>,
          authorizer: this._authClient.getAuthorizer() as Authorizer,
        } as ClientEventContextOfAuthorizer<Authorizer, Value>);
      })

      .on('events', (values) => {
        for (const value of values) {
          this._emitEvent({
            event: createEvent(
              value,
              this._channel as WebviewConnection,
              this._user as UserOfAuthorizer<Authorizer>
            ),
            auth: this.authContext as ContextOfAuthorizer<Authorizer>,
            authorizer: this._authClient.getAuthorizer() as Authorizer,
          } as ClientEventContextOfAuthorizer<Authorizer, Value>);
        }
      })

      .on('disconnect', ({ reason }) => {
        const channel = this._channel;
        this._channel = null;

        const disconnectValue: DisconnectEventValue = {
          category: 'connection',
          type: 'disconnect',
          payload: { reason },
        };

        this._emitEvent({
          event: createEvent(
            disconnectValue,
            channel as WebviewConnection,
            this._user as UserOfAuthorizer<Authorizer>
          ),
          auth: this.authContext as ContextOfAuthorizer<Authorizer>,
          authorizer: this._authClient.getAuthorizer() as Authorizer,
        } as ClientEventContextOfAuthorizer<Authorizer, Value>);
      })

      .on('error', this._emitError.bind(this));
  }
}

export default WebviewClient;
