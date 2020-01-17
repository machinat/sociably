// @flow
import invariant from 'invariant';
import type { MachinatUser } from 'machinat/types';
import WS from './ws';
import type {
  ConnectBody,
  DisconnectBody,
  EventBody,
  RejectBody,
} from '../socket';
import MachinatSocket from '../socket';
import { WEBSOCKET } from '../constant';
import {
  ConnectionChannel,
  UserScopeChannel,
  TopicScopeChannel,
} from '../channel';
import { ConnectionError } from '../error';
import Connection from '../connection';
import type { WebSocketChannel, ClientRegistratorFunc } from '../types';

declare var location: Location;

export type ClientEvent = {|
  type: string,
  subtype: void | string,
  payload: any,
|};

type ClientEventContext = {|
  user: ?MachinatUser,
  channel: WebSocketChannel,
  event: ClientEvent,
|};

type ClientOptions<RegData> = {
  url?: string,
  registrator: ClientRegistratorFunc<RegData>,
};

type PendingEventJob = {
  event: ClientEvent,
  resolve: () => void,
  reject: Error => void,
};

const MACHINAT_WEBSOCKET_PROTOCOL_V0 = 'machinat-websocket-v0';

const createSocket = (url: string) => {
  const webSocket = new WS(url, MACHINAT_WEBSOCKET_PROTOCOL_V0);

  return new MachinatSocket('', webSocket, (null: any));
};

class WebScoketClient<RegData> {
  _serverLocation: string;
  _registrator: ClientRegistratorFunc<RegData>;

  _socket: MachinatSocket;
  _connected: boolean;

  _registerSeq: number;
  _queuedJobs: PendingEventJob[];

  _user: ?MachinatUser;

  _connId: string;
  _connChannel: ConnectionChannel;

  _eventListeners: ((ClientEventContext) => void)[];
  _errorListeners: ((Error) => void)[];

  constructor({ url, registrator }: ClientOptions<RegData> = {}) {
    invariant(registrator, 'options.registrator should not be empty');

    this._serverLocation =
      url ||
      `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
    this._registrator = registrator;

    this._connected = false;
    this._queuedJobs = [];
    this._eventListeners = [];
    this._errorListeners = [];

    const socket = createSocket(this._serverLocation);
    this._socket = socket;

    const handleError = this._emitError.bind(this);
    socket.on('open', () => {
      this._handleSocketOpen().catch(handleError);
    });

    socket.on('connect', this._handleConnect.bind(this));
    socket.on('disconnect', this._handleDisconnect.bind(this));
    socket.on('event', this._handleEvent.bind(this));

    socket.on('reject', this._handleReject.bind(this));
    socket.on('error', handleError);
    socket.on('connect_fail', this._handleConnectFail.bind(this));
  }

  get connected() {
    return this._connected;
  }

  async send(event: ClientEvent): Promise<void> {
    if (!this._connected) {
      await new Promise((resolve, reject) => {
        this._queuedJobs.push({ resolve, reject, event });
      });
    } else {
      await this._socket.event({ ...event, connId: this._connId });
    }
  }

  disconnect(reason: string) {
    if (this._connected) {
      this._connected = false;
      this._socket
        .disconnect({ connId: this._connId, reason })
        .catch(this._emitError);
    }
  }

  onEvent(listener: ClientEventContext => void) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(listener: ClientEventContext => void) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  _emitEvent(event: ClientEvent, channel: WebSocketChannel) {
    for (const listener of this._eventListeners) {
      listener({ event, channel, user: this._user });
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
    const { data, user } = await this._registrator();

    const seq = await this._socket.register({ data });
    this._registerSeq = seq;
    this._user = user;
  }

  _handleConnect({ connId, seq }: ConnectBody) {
    if (seq !== this._registerSeq) {
      return;
    }

    this._connected = true;
    this._connId = connId;
    this._connChannel = new ConnectionChannel(
      new Connection('*', '*', connId, null)
    );

    this._emitEvent(
      {
        type: 'connect',
        subtype: undefined,
        payload: undefined,
      },
      this._connChannel
    );

    for (const { event, resolve, reject } of this._queuedJobs) {
      this._socket
        .event({ ...event, connId })
        .then(resolve)
        .catch(reject);
    }
    this._queuedJobs = [];
  }

  _handleDisconnect({ connId }: DisconnectBody) {
    if (this._connId === connId) {
      this._connected = false;
      this._emitEvent(
        {
          type: 'disconnect',
          subtype: undefined,
          payload: undefined,
        },
        this._connChannel
      );
    }
  }

  _handleEvent({ connId, type, subtype, payload, scopeUId }: EventBody) {
    if (this._connected === true && this._connId === connId) {
      let channel = this._connChannel;

      if (scopeUId) {
        const [platform, scopeType, scopeSubtype, scopeId] = scopeUId.split(
          ':'
        );
        channel =
          platform !== WEBSOCKET
            ? channel
            : scopeType === 'user' && this._user
            ? new UserScopeChannel(this._user)
            : scopeType === 'topic'
            ? new TopicScopeChannel(scopeSubtype, scopeId)
            : channel;
      }

      this._emitEvent({ type, subtype, payload }, channel);
    }
  }

  _handleReject({ seq, reason }: RejectBody) {
    if (seq === this._registerSeq) {
      this._emitError(new ConnectionError(reason));
    }
  }

  _handleConnectFail({ seq }: DisconnectBody) {
    if (seq === this._registerSeq) {
      const err = new ConnectionError('connect handshake fail');
      this._emitError(err);
    }
  }
}

export default WebScoketClient;
