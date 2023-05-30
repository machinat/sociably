import type { SociablyUser } from '@sociably/core';
import { AnyMarshalType, BaseMarshaler } from '@sociably/core/base/Marshaler';
import WebSocketConnection from '../Connection.js';
import createEvent from '../utils/createEvent.js';
import Connector from './Connector.js';
import ClientEmitter from './ClientEmitter.js';
import type {
  ClientLoginFn,
  EventInput,
  WebSocketEvent,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '../types.js';

type ClientOptions<User extends null | SociablyUser, Credential> = {
  url?: string;
  login?: ClientLoginFn<User, Credential>;
  marshalTypes?: AnyMarshalType[];
};

type WebSocketClientContext<
  User extends null | SociablyUser,
  Value extends EventValue
> = {
  event: WebSocketEvent<Value, User>;
};

class WebScoketClient<
  User extends null | SociablyUser = null,
  Value extends EventValue = EventValue,
  Credential = null
> extends ClientEmitter<WebSocketClientContext<User, Value>> {
  private _connector: Connector<User>;

  private _user: null | User;
  private _thread: null | WebSocketConnection;

  constructor({
    url,
    login,
    marshalTypes,
  }: ClientOptions<User, Credential> = {}) {
    super();

    this._user = null;
    this._thread = null;

    this._connector = this._initConnector(
      url || '/',
      login ||
        (() =>
          Promise.resolve({
            user: null as never,
            credential: null as never,
          })),
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

  get thread(): null | WebSocketConnection {
    return this._thread;
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
        this._thread = new WebSocketConnection('*', connId);

        const connectEvent: ConnectEventValue = {
          category: 'connection',
          type: 'connect',
          payload: null,
        };
        this._emitEvent({
          event: createEvent(connectEvent, this._thread, this._user),
        });
      })
      .on('events', (values) => {
        for (const value of values) {
          this._emitEvent({
            event: createEvent(
              value,
              this._thread as WebSocketConnection,
              this._user as User
            ),
          });
        }
      })
      .on('disconnect', ({ reason }) => {
        const thread = this._thread;
        this._thread = null;

        const disconnectValue: DisconnectEventValue = {
          category: 'connection',
          type: 'disconnect',
          payload: { reason },
        };
        this._emitEvent({
          event: createEvent(
            disconnectValue,
            thread as WebSocketConnection,
            this._user as User
          ),
        });
      })
      .on('error', this._emitError.bind(this));
  }
}

export default WebScoketClient;
