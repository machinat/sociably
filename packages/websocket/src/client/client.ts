import type { MachinatUser } from '@machinat/core';
import { AnyMarshalType, BaseMarshaler } from '@machinat/core/base/Marshaler';
import { WebSocketConnection } from '../channel';
import createEvent from '../utils/createEvent';
import Connector from './Connector';
import ClientEmitter from './ClientEmitter';
import type {
  ClientLoginFn,
  EventInput,
  WebSocketEvent,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '../types';

type ClientOptions<User extends null | MachinatUser, Credential> = {
  url?: string;
  login?: ClientLoginFn<User, Credential>;
  marshalTypes?: AnyMarshalType[];
};

type WebSocketClientContext<
  User extends null | MachinatUser,
  Value extends EventValue
> = {
  event: WebSocketEvent<Value, User>;
};

class WebScoketClient<
  User extends null | MachinatUser = null,
  Value extends EventValue = EventValue,
  Credential = null
> extends ClientEmitter<WebSocketClientContext<User, Value>> {
  private _connector: Connector<User>;

  private _user: null | User;
  private _channel: null | WebSocketConnection;

  constructor({
    url,
    login,
    marshalTypes,
  }: ClientOptions<User, Credential> = {}) {
    super();

    this._user = null;
    this._channel = null;

    this._connector = this._initConnector(
      url || '/',
      login ||
        (() => Promise.resolve({ user: null as any, credential: null as any })),
      new BaseMarshaler(marshalTypes || [])
    );

    this._connector.connect();
  }

  get isConnected(): boolean {
    return this._connector.isConnected();
  }

  get isClosed(): boolean {
    return this._connector.isClosed;
  }

  get user(): null | User {
    return this._user;
  }

  get channel(): null | WebSocketConnection {
    return this._channel;
  }

  async send(content: EventInput | EventInput[]): Promise<void> {
    await this._connector.send(Array.isArray(content) ? content : [content]);
  }

  close(code?: number, reason?: string): void {
    this._connector.close(code, reason);
  }

  private _initConnector(
    sockerUrl: string,
    login: ClientLoginFn<User, Credential>,
    marshaler: BaseMarshaler
  ) {
    return new Connector<User>(sockerUrl, login, marshaler)
      .on('connect', ({ connId, user }) => {
        this._user = user;
        this._channel = new WebSocketConnection('*', connId);

        const connectEvent: ConnectEventValue = {
          category: 'connection',
          type: 'connect',
          payload: null,
        };
        this._emitEvent({
          event: createEvent(connectEvent, this._channel, this._user),
        });
      })
      .on('events', (values) => {
        for (const value of values) {
          this._emitEvent({
            event: createEvent(
              value,
              this._channel as WebSocketConnection,
              this._user as User
            ),
          });
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
            channel as WebSocketConnection,
            this._user as User
          ),
        });
      })
      .on('error', this._emitError.bind(this));
  }
}

export default WebScoketClient;
