import type { MachinatUser } from '@machinat/core/types';
import { AnyMarshalType, BaseMarshaler } from '@machinat/core/base/Marshaler';
import { WebSocketConnection } from '../channel';
import createEvent from '../utils/createEvent';
import Connector from './Connector';
import Emitter from './Emitter';
import type {
  ClientLoginFn,
  EventInput,
  WebSocketEvent,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '../types';

type ClientOptions<User extends null | MachinatUser> = {
  url?: string;
  login?: ClientLoginFn<User, unknown>;
  marshalTypes?: AnyMarshalType[];
};

class WebScoketClient<
  User extends null | MachinatUser = null,
  Value extends EventValue = EventValue
> extends Emitter<[WebSocketEvent<Value, User>]> {
  private _connector: Connector<User>;

  private _user: null | User;
  private _channel: null | WebSocketConnection;

  constructor({ url, login, marshalTypes }: ClientOptions<User> = {}) {
    super();

    this._user = null;
    this._channel = null;

    const { host, pathname } = window.location;
    this._connector = new Connector(
      new URL(url || '/', `wss://${host}${pathname}`).href,
      login ||
        (() => Promise.resolve({ user: null as never, credential: null })),
      new BaseMarshaler(marshalTypes || [])
    );

    this._connector.on('connect', ({ connId, user }) => {
      this._user = user;
      this._channel = new WebSocketConnection('*', connId);

      const connectEvent: ConnectEventValue = {
        kind: 'connection',
        type: 'connect',
        payload: null,
      };
      this._emitEvent(createEvent(connectEvent, this._channel, this._user));
    });

    this._connector.on('events', (values) => {
      for (const value of values) {
        this._emitEvent(
          createEvent(
            value,
            this._channel as WebSocketConnection,
            this._user as User
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
          channel as WebSocketConnection,
          this._user as User
        )
      );
    });

    this._connector.on('error', this._emitError.bind(this));

    this._connector.start().catch(this._emitError.bind(this));
  }

  get isConnected(): boolean {
    return this._connector.isConnected();
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

  disconnect(reason: string): void {
    this._connector.disconnect(reason);
  }
}

export default WebScoketClient;
