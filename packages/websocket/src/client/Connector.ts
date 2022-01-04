/// <reference lib="DOM" />
import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';
import type { MachinatUser } from '@machinat/core';
import type { Marshaler } from '@machinat/core/base/Marshaler';
import type {
  default as Socket, // eslint-disable-line import/no-named-default
  ConnectBody,
  DisconnectBody,
  EventsBody,
  RejectBody,
} from '../socket';
import SocketError from '../error';
import type { ClientLoginFn, EventInput } from '../types';
import createClientSocket from './createClientSocket';

type PendingEvent = {
  inputs: EventInput[];
  resolve: () => void;
  reject: (err: Error) => void;
};

const Emitter = EventEmitter as { new <T>(): TypedEmitter<T> };

export type ConnectorContext<User extends null | MachinatUser> = {
  connId: string;
  user: User;
};

class WebScoketConnector<User extends null | MachinatUser> extends Emitter<{
  connect: (ctx: ConnectorContext<User>) => void;
  events: (events: EventInput[], ctx: ConnectorContext<User>) => void;
  disconnect: (
    reason: { reason?: string },
    ctx: ConnectorContext<User>
  ) => void;
  error: (err: Error) => void;
}> {
  private _serverUrl: string;
  private _login: ClientLoginFn<User, unknown>;
  private _socket: null | Socket;
  private _marshaler: Marshaler;

  private _loginSeq: number;
  private _queuedEvents: PendingEvent[];

  private _connId: void | string;
  private _user: User;
  private _isDisconnecting: boolean;

  constructor(
    serverUrl: string,
    login: ClientLoginFn<User, unknown>,
    marshaler: Marshaler
  ) {
    super();

    this._login = login;
    this._serverUrl = serverUrl;
    this._marshaler = marshaler;

    this._queuedEvents = [];
    this._connId = undefined;
    this._isDisconnecting = false;
  }

  isConnected(): boolean {
    return !this._isDisconnecting && !!this._connId;
  }

  async start(): Promise<void> {
    const { host, pathname } = window.location;
    const { user, credential } = await this._login();

    const socket = await createClientSocket(
      new URL(this._serverUrl, `wss://${host}${pathname}`).href
    );

    this._user = user;
    this._socket = socket;

    socket.on('connect', this._handleConnect.bind(this));
    socket.on('disconnect', this._handleDisconnect.bind(this));
    socket.on('events', this._handleEvents.bind(this));
    socket.on('reject', this._handleReject.bind(this));
    socket.on('error', this._emitError.bind(this));

    this._loginSeq = await socket.login({ credential });
  }

  async send(events: EventInput[]): Promise<void> {
    const marshaledEvents = events.map(({ category, type, payload }) => ({
      category,
      type,
      payload: this._marshaler.marshal(payload),
    }));

    if (!this._socket || !this._connId) {
      await new Promise<void>((resolve, reject) => {
        this._queuedEvents.push({
          resolve,
          reject,
          inputs: marshaledEvents,
        });
      });
    } else {
      await this._socket.dispatch({
        connId: this._connId,
        values: marshaledEvents,
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

  private _handleConnect(
    { connId, seq }: ConnectBody,
    _seq: number,
    socket: Socket
  ) {
    // for muliplexing, ignore CONNECT for other LOGIN
    if (seq !== this._loginSeq) {
      return;
    }

    this._connId = connId;
    this.emit('connect', { connId, user: this._user });

    for (const { inputs, resolve, reject } of this._queuedEvents) {
      socket.dispatch({ values: inputs, connId }).then(resolve).catch(reject);
    }
    this._queuedEvents = [];
  }

  private _handleDisconnect({ connId, reason }: DisconnectBody) {
    if (this._connId === connId) {
      this._isDisconnecting = false;
      this._connId = undefined;

      this.emit('disconnect', { reason }, { connId, user: this._user });
    }
  }

  private _handleEvents({ connId, values }: EventsBody) {
    if (this._connId === connId) {
      this.emit(
        'events',
        values.map(({ category, type, payload }) => ({
          category,
          type,
          payload: this._marshaler.unmarshal(payload),
        })),
        { connId, user: this._user }
      );
    }
  }

  private _handleReject({ seq, reason }: RejectBody) {
    if (seq === this._loginSeq) {
      this._emitError(new SocketError(reason));
    }
  }

  private _emitError(err: Error) {
    this.emit('error', err);
  }
}

export default WebScoketConnector;
