import type { MachinatUser } from '@machinat/core/types';
import type {
  default as Socket, // eslint-disable-line import/no-named-default
  ConnectBody,
  DisconnectBody,
  DispatchBody,
  RejectBody,
} from '../socket';
import { ConnectionChannel } from '../channel';
import createEvent from '../event';
import SocketError from '../error';
import type {
  ClientLoginFn,
  EventInput,
  WebSocketChannel,
  WebSocketEvent,
} from '../types';
import openSocket from './ws';

type ClientOptions<Credential> = {
  url?: string;
  authorize?: ClientLoginFn<Credential>;
};

type PendingEvent = {
  events: EventInput[];
  resolve: () => void;
  reject: (err: Error) => void;
};

type ClientEventContext = {
  user: null | MachinatUser;
  channel: WebSocketChannel;
  event: WebSocketEvent;
};

type ClientEventListener = (ctx: ClientEventContext) => void;

class WebScoketClient<Credential = null> {
  private _serverURL: string;
  private _authorize: ClientLoginFn<Credential>;
  private _socket: null | Socket;

  private _loginSeq: number;
  private _queuedEvents: PendingEvent[];

  private _connId: void | string;
  private _user: null | MachinatUser;
  private _channel: null | ConnectionChannel;
  private _isDisconnecting: boolean;

  private _eventListeners: ClientEventListener[];
  private _errorListeners: ((err: Error) => void)[];

  constructor({ url, authorize }: ClientOptions<Credential> = {}) {
    const { protocol, host } = window.location;

    this._serverURL = new URL(
      url || '',
      `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`
    ).href;

    this._authorize =
      authorize ||
      (() => Promise.resolve({ user: null, credential: null as any }));

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

  get channel(): null | ConnectionChannel {
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

  onEvent(listener: ClientEventListener): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(listener: ClientEventListener): boolean {
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
    const { user, credential } = await this._authorize();
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

  private _emitEvent(category: undefined | string, type: string, payload: any) {
    const context = {
      channel: this._channel as ConnectionChannel,
      user: this._user,
      event: createEvent(category, type, payload),
    };
    for (const listener of this._eventListeners) {
      listener.call(this, context);
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
    this._channel = new ConnectionChannel('*', connId);

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
      for (const { type, category, payload } of events) {
        this._emitEvent(category, type, payload);
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
