import type { MachinatUser } from '@machinat/core/types';
import type {
  default as Socket, // eslint-disable-line import/no-named-default
  ConnectBody,
  DisconnectBody,
  DispatchBody,
  RejectBody,
} from '../socket';
import { WebSocketConnection } from '../channel';
import createEvent from '../event';
import SocketError from '../error';
import type {
  ClientLoginFn,
  EventInput,
  WebSocketEvent,
  EventValue,
} from '../types';
import openSocket from './ws';

type ClientOptions<Login extends ClientLoginFn<any, unknown>> = {
  url?: string;
  login?: Login;
};

type PendingEvent = {
  events: EventInput[];
  resolve: () => void;
  reject: (err: Error) => void;
};

type ClientEventListener<
  Value extends EventValue<string, string, unknown>,
  User extends null | MachinatUser
> = (event: WebSocketEvent<Value, User>) => void;

class WebScoketClient<
  Value extends EventValue<string, string, unknown> = EventValue<
    string,
    string,
    unknown
  >,
  Login extends ClientLoginFn<any, unknown> = ClientLoginFn<null, null>
> {
  private _serverURL: string;
  private _login: ClientLoginFn<any, unknown>;
  private _socket: null | Socket;

  private _loginSeq: number;
  private _queuedEvents: PendingEvent[];

  private _connId: void | string;
  private _user: null | MachinatUser;
  private _channel: null | WebSocketConnection;
  private _isDisconnecting: boolean;

  private _eventListeners: ClientEventListener<
    Value,
    Login extends ClientLoginFn<infer User, unknown> ? User : never
  >[];

  private _errorListeners: ((err: Error) => void)[];

  constructor({ url, login }: ClientOptions<Login> = {} as any) {
    const { protocol, host } = window.location;

    this._serverURL = new URL(
      url || '',
      `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`
    ).href;

    this._login =
      login || (() => Promise.resolve({ user: null, credential: null }));

    this._queuedEvents = [];
    this._eventListeners = [];
    this._errorListeners = [];

    this._connId = undefined;
    this._user = null;
    this._channel = null;
    this._isDisconnecting = false;

    this._start().catch(this._emitError.bind(this));
  }

  get connected(): boolean {
    return !this._isDisconnecting && !!this._connId;
  }

  get user(): null | MachinatUser {
    return this._user;
  }

  get channel(): null | WebSocketConnection {
    return this._channel;
  }

  async send(...events: EventInput[]): Promise<void> {
    if (!this._socket || !this._connId) {
      await new Promise((resolve, reject) => {
        this._queuedEvents.push({
          resolve,
          reject,
          events,
        });
      });
    } else {
      await this._socket.dispatch({
        connId: this._connId,
        events,
      });
    }
  }

  disconnect(reason: string): void {
    if (!this._socket) {
      return;
    }

    this._isDisconnecting = true;
    if (this._connId) {
      this._socket
        .disconnect({ connId: this._connId, reason })
        .catch(this._emitError.bind(this));
    }
  }

  onEvent(
    listener: ClientEventListener<
      Value,
      Login extends ClientLoginFn<infer User, unknown> ? User : never
    >
  ): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(
    listener: ClientEventListener<
      Value,
      Login extends ClientLoginFn<infer User, unknown> ? User : never
    >
  ): boolean {
    const idx = this._eventListeners.findIndex((fn) => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  onError(listener: (err: Error) => void): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._errorListeners.push(listener);
  }

  removeErrorListener(listener: (err: Error) => void): boolean {
    const idx = this._errorListeners.findIndex((fn) => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  private async _start() {
    const { user, credential } = await this._login();
    this._user = user;

    const socket = await openSocket(this._serverURL);
    this._socket = socket;

    socket.on('connect', this._handleConnect.bind(this));
    socket.on('disconnect', this._handleDisconnect.bind(this));
    socket.on('dispatch', this._handleDispatch.bind(this));
    socket.on('reject', this._handleReject.bind(this));
    socket.on('error', this._emitError.bind(this));

    this._loginSeq = await socket.login({ credential });
  }

  private _emitEvent(kind: undefined | string, type: string, payload: unknown) {
    const event = createEvent(
      kind,
      type,
      payload,
      this._channel as WebSocketConnection,
      this._user
    );

    for (const listener of this._eventListeners) {
      listener.call(this, event);
    }
  }

  private _emitError(err: Error) {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      listener(err);
    }
  }

  private _handleConnect(
    { connId, seq }: ConnectBody,
    _seq: number,
    socket: Socket
  ) {
    if (seq !== this._loginSeq) {
      return;
    }

    this._connId = connId;
    this._channel = new WebSocketConnection('*', connId);

    this._emitEvent('connection', 'connect', undefined);

    for (const { events, resolve, reject } of this._queuedEvents) {
      socket.dispatch({ events, connId }).then(resolve).catch(reject);
    }
    this._queuedEvents = [];
  }

  private _handleDisconnect({ connId }: DisconnectBody) {
    if (this._connId === connId) {
      this._isDisconnecting = false;
      this._connId = undefined;
      this._emitEvent('connection', 'disconnect', undefined);
    }
  }

  private _handleDispatch({ connId, events }: DispatchBody) {
    if (this._connId === connId) {
      for (const { type, kind, payload } of events) {
        this._emitEvent(kind, type, payload);
      }
    }
  }

  private _handleReject({ seq, reason }: RejectBody) {
    if (seq === this._loginSeq) {
      this._emitError(new SocketError(reason));
    }
  }
}

export default WebScoketClient;
