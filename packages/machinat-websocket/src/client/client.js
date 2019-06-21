// @flow
import WS from 'ws';

import type {
  ConnectBody,
  DisconnectBody,
  EventBody,
  RegisterBody,
  RejectBody,
} from '../socket';
import type { ConnectionInfo } from '../types';
import MachinatSocket from '../socket';

import Channel from '../channel';
import { ConnectionError } from '../error';

export type ClientEvent = {|
  type: string,
  subtype: void | string,
  payload: any,
|};

type ClientEventFrame = {|
  channel: Channel,
  event: ClientEvent,
  connectionInfo: ConnectionInfo,
  client: WebScoketClient, // eslint-disable-line no-use-before-define
|};

type ClientOptions = {
  url: string,
  register: RegisterBody,
};

type ClientOptionsInput = $Shape<ClientOptions>;

type PendingEventJob = {
  event: ClientEvent,
  resolve: () => void,
  reject: Error => void,
};

const MACHINAT_WEBSOCKET_PROTOCOL_V0 = 'machinat-websocket-v0';

const createSocket = (url: string) => {
  const webSocket = new WS(url, MACHINAT_WEBSOCKET_PROTOCOL_V0);

  return new MachinatSocket(webSocket, '');
};

class WebScoketClient {
  options: ClientOptions;
  _connected: boolean;
  _socket: MachinatSocket;
  _registerSeq: number;
  _channel: Channel;
  _connectionInfo: ConnectionInfo;

  _queuedEventJobs: PendingEventJob[];

  _eventListeners: ((ClientEventFrame) => void)[];
  _errorListeners: ((Error) => void)[];

  constructor(optionsInput: ClientOptionsInput) {
    this._errorListeners = [];

    const defaultOptions = {
      url: './',
      register: { type: 'default' },
    };
    const options = Object.assign(defaultOptions, optionsInput);

    this.options = options;
    this._connected = false;
    this._queuedEventJobs = [];
    this._eventListeners = [];

    this._socket = createSocket(options.url);

    this._socket.on('open', this._handleSocketOpen);
    this._socket.on('close', this._handleSocketClose);
    this._socket.on('error', this._handleSocketError);

    this._socket.on('connect', this._handleConnect);
    this._socket.on('disconnect', this._handleDisconnect);
    this._socket.on('event', this._handleEvent);

    this._socket.on('reject', this._handleReject);
    this._socket.on('error', this._emitError);
    this._socket.on('connect_fail', this._handleConnectFail);

    // TODO: implement answering
    // this._socket.on('answer');
  }

  get connected() {
    return this._connected;
  }

  get channel() {
    return this._channel;
  }

  get connectionInfo() {
    return this._connectionInfo;
  }

  async send(event: ClientEvent): Promise<void> {
    if (!this._connected) {
      await new Promise((resolve, reject) => {
        this._queuedEventJobs.push({ resolve, reject, event });
      });
    } else {
      await this._socket.event({ ...event, uid: this._channel.uid });
    }
  }

  close(reason: string) {
    if (this._connected) {
      this._connected = false;
      this._socket
        .disconnect({ uid: this._channel.uid, reason })
        .catch(this._emitError);
    }
  }

  onEvent(listener: ClientEventFrame => void) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(listener: ClientEventFrame => void) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  _emitEvent(event: ClientEvent) {
    for (const listener of this._eventListeners) {
      listener({
        event,
        channel: this._channel,
        connectionInfo: this._connectionInfo,
        client: this,
      });
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

  _emitError = (err: Error) => {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      listener(err);
    }
  };

  _handleSocketOpen = async () => {
    const seq = await this._socket.register(this.options.register);
    this._registerSeq = seq;
  };

  _handleSocketClose = () => {
    if (this._connected === true) {
      this._connected = false;
      this._emitEvent({
        type: '@disconnect',
        subtype: undefined,
        payload: undefined,
      });
    }
  };

  _handleConnect = ({ uid, req, info }: ConnectBody) => {
    if (req !== this._registerSeq) {
      return;
    }

    const channel = Channel.fromUid(uid);
    if (channel === null) {
      this._emitError(new TypeError('invalid channel uid received'));
      return;
    }

    this._connected = true;
    this._channel = channel;
    this._connectionInfo = info || {};
    this._emitEvent({
      type: '@connect',
      subtype: undefined,
      payload: undefined,
    });

    for (const { event, resolve, reject } of this._queuedEventJobs) {
      this._socket
        .event({ ...event, uid: this._channel.uid })
        .then(resolve)
        .catch(reject);
    }
    this._queuedEventJobs = [];
  };

  _handleSocketError(err: Error) {
    this._emitError(err);
  }

  _handleDisconnect = ({ uid }: DisconnectBody) => {
    if (this._channel && this._channel.uid === uid) {
      this._connected = false;
      this._emitEvent({
        type: '@disconnect',
        subtype: undefined,
        payload: undefined,
      });
    }
  };

  _handleEvent = (body: EventBody) => {
    const { uid, type, subtype, payload } = body;
    if (
      this._connected === true &&
      this._channel &&
      this._channel.uid === uid
    ) {
      this._emitEvent({ type, subtype, payload });
    }
  };

  _handleReject = ({ req, reason }: RejectBody) => {
    if (req === this._registerSeq) {
      this._emitError(new ConnectionError(reason));
    }
  };

  _handleConnectFail = ({ req }: DisconnectBody) => {
    if (req === this._registerSeq) {
      const err = new ConnectionError('connect handshake fail');
      this._emitError(err);
    }
  };
}

export default WebScoketClient;
