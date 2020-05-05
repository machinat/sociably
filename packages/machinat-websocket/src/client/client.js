// @flow
import type { MachinatUser } from '@machinat/core/types';
import WS from './ws';
import type {
  ConnectBody,
  DisconnectBody,
  DispatchBody,
  RejectBody,
} from '../socket';
import Socket from '../socket';
import { ConnectionChannel } from '../channel';
import SocketError from '../error';
import type { ClientLoginFn, EventValue } from '../types';

declare var location: Location;

type ClientOptions<Credential> = {
  url?: string,
  login?: ClientLoginFn<Credential>,
};

type PendingEvent = {
  events: EventValue[],
  resolve: () => void,
  reject: Error => void,
};

const MACHINAT_WEBSOCKET_PROTOCOL_V0 = 'machinat-websocket-v0';

const createSocket = (url: string) => {
  const ws = new WS(url, MACHINAT_WEBSOCKET_PROTOCOL_V0);

  return new Socket('', ws, (null: any));
};

class WebScoketClient<Credential = null> {
  _serverLocation: string;
  _getLoginAuth: ClientLoginFn<Credential>;
  _socket: Socket;

  _loginSeq: number;
  _queuedEvents: PendingEvent[];

  _connId: void | string;
  _user: null | MachinatUser;
  _channel: null | ConnectionChannel;
  _isDisconnecting: boolean;

  _eventListeners: ((EventValue, WebScoketClient<Credential>) => void)[];
  _errorListeners: ((Error) => void)[];

  constructor({ url, login }: ClientOptions<Credential> = {}) {
    this._serverLocation =
      url ||
      `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
    this._getLoginAuth =
      login || (() => Promise.resolve({ user: null, credential: (null: any) }));

    this._queuedEvents = [];
    this._eventListeners = [];
    this._errorListeners = [];

    this._connId = undefined;
    this._user = null;
    this._channel = null;
    this._isDisconnecting = false;

    const socket = createSocket(this._serverLocation);
    this._socket = socket;

    const handleError = this._emitError.bind(this);
    socket.on('open', () => {
      this._handleSocketOpen().catch(handleError);
    });

    socket.on('connect', this._handleConnect.bind(this));
    socket.on('disconnect', this._handleDisconnect.bind(this));
    socket.on('dispatch', this._handleDispatch.bind(this));

    socket.on('reject', this._handleReject.bind(this));
    socket.on('error', handleError);
    socket.on('connect_fail', this._handleConnectFail.bind(this));
  }

  get connected(): boolean {
    return !this._isDisconnecting && !!this._connId;
  }

  get user() {
    return this._user;
  }

  get channel() {
    return this._channel;
  }

  async send(...events: EventValue[]): Promise<void> {
    if (!this._connId) {
      await new Promise((resolve, reject) => {
        this._queuedEvents.push({ resolve, reject, events });
      });
    } else {
      await this._socket.dispatch({
        connId: this._connId,
        events,
      });
    }
  }

  disconnect(reason: string) {
    this._isDisconnecting = true;
    if (this._connId) {
      this._socket
        .disconnect({ connId: this._connId, reason })
        .catch(this._emitError);
    }
  }

  onEvent(listener: (EventValue, WebScoketClient<Credential>) => void) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(
    listener: (EventValue, WebScoketClient<Credential>) => void
  ) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  _emitEvent(event: EventValue) {
    for (const listener of this._eventListeners) {
      listener(event, this);
    }
  }

  onError(listener: Error => void) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._errorListeners.push(listener);
  }

  removeErrorListener(listener: Error => void) {
    const idx = this._errorListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  _emitError(err: Error) {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      listener(err);
    }
  }

  async _handleSocketOpen() {
    const { user, credential } = await this._getLoginAuth();

    const seq = await this._socket.login({ credential });
    this._loginSeq = seq;
    this._user = user;
  }

  _handleConnect({ connId, seq }: ConnectBody) {
    if (seq !== this._loginSeq) {
      return;
    }

    this._connId = connId;
    this._channel = new ConnectionChannel('*', connId);

    this._emitEvent({
      type: 'connect',
      subtype: undefined,
      payload: undefined,
    });

    for (const { events, resolve, reject } of this._queuedEvents) {
      this._socket
        .dispatch({ events, connId })
        .then(resolve)
        .catch(reject);
    }
    this._queuedEvents = [];
  }

  _handleDisconnect({ connId }: DisconnectBody) {
    if (this._connId === connId) {
      this._isDisconnecting = false;
      this._connId = undefined;
      this._emitEvent({
        type: 'disconnect',
        subtype: undefined,
        payload: undefined,
      });
    }
  }

  _handleDispatch({ connId, events }: DispatchBody) {
    if (this._connId === connId) {
      for (const event of events) {
        this._emitEvent(event);
      }
    }
  }

  _handleReject({ seq, reason }: RejectBody) {
    if (seq === this._loginSeq) {
      this._emitError(new SocketError(reason));
    }
  }

  _handleConnectFail({ seq }: DisconnectBody) {
    if (seq === this._loginSeq) {
      const err = new SocketError('connect handshake fail');
      this._emitError(err);
    }
  }
}

export default WebScoketClient;
