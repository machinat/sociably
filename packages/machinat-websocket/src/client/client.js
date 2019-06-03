// @flow
import EventEmitter from 'events';
import WS from 'ws';

import type {
  ConnectBody,
  DisconnectBody,
  EventBody,
  RegisterBody,
  RejectBody,
} from '../socket';
import MachinatSocket, { SOCKET_OPEN } from '../socket';

import WebSocketChannel from '../channel';
import { ConnectionError } from '../error';

import Connection from './connection';
import type { ClientEvent } from './connection';

type ClientOptions = {
  url?: string,
  // TODO:
  // reconnecting: boolean,
  // heartbeatInterval: number,
  // heartbeatTimeout: number,
  // socketTimeout: number,
};

type ClientOptionsInput = $Shape<ClientOptions>;

type QueuedRegisterJob = {
  body: RegisterBody,
  connection: Connection,
};

const MACHINAT_WEBSOCKET_PROTOCOL_V0 = 'machinat-websocket-v0';

const createSocket = (url: string) => {
  const webSocket = new WS(url, MACHINAT_WEBSOCKET_PROTOCOL_V0);

  return new MachinatSocket(webSocket, '');
};

class WebClient extends EventEmitter {
  options: ClientOptions;
  _socket: MachinatSocket;

  _queuedRegister: QueuedRegisterJob[];

  _registeringConns: Map<number, Connection>;
  _connectedConns: Map<string, Connection>;

  constructor(optionsInput: ClientOptionsInput) {
    super();

    const defaultOptions = {
      url: './',
    };
    const options = Object.assign(defaultOptions, optionsInput);

    this.options = options;
    this._queuedRegister = [];

    this._registeringConns = new Map();
    this._connectedConns = new Map();

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

  get state() {
    return this._socket.readyState();
  }

  register(body: RegisterBody): Connection {
    const connection = this._createConnection();

    if (this._socket.readyState() === SOCKET_OPEN) {
      this._socket
        .register(body)
        .then(seq => this._registeringConns.set(seq, connection))
        .catch(this._emitError);
    } else {
      this._queuedRegister.push({ body, connection });
    }

    return connection;
  }

  close(code: number, reason: string) {
    this._socket.close(code, reason);
  }

  _emitConnect(connection: Connection) {
    this.emit('connect', connection);
  }

  _emitDisconnect(connection: Connection) {
    this.emit('disconnect', connection);
  }

  _emitError = (err: Error) => {
    this.emit('error', err);
  };

  _createConnection() {
    const connection = new Connection(
      async (event: ClientEvent) => {
        const channel = connection._channel;
        if (channel === undefined) {
          throw new ConnectionError('connection is not connected yet');
        }

        await this._socket.event({ uid: channel.uid, ...event });
      },
      async (reason: string) => {
        if (connection._channel !== undefined) {
          const { uid } = connection._channel;
          await this._socket.disconnect({ uid, reason });
        }
      }
    );

    return connection;
  }

  _handleSocketOpen = () => {
    for (const { body, connection } of this._queuedRegister) {
      this._socket
        .register(body)
        .then(seq => this._registeringConns.set(seq, connection))
        .catch(this._emitError);
    }

    this._queuedRegister = [];
    this.emit('open');
  };

  _handleSocketClose = (code: number, reason: string) => {
    this._socket.removeAllListeners();
    this.emit('close', code, reason);
  };

  _handleSocketError(err: Error) {
    this._emitError(err);
  }

  _handleConnect = ({ uid, req, info }: ConnectBody, seq: number) => {
    const channel = WebSocketChannel.fromUid(uid);
    if (channel === null) {
      this._socket
        .reject({ req: seq, reason: 'uid invalid' })
        .catch(this._emitError);
      return;
    }

    let connection = this._registeringConns.get((req: any));
    if (connection !== undefined) {
      connection._setConnected(channel, info || {});
      connection._emitEvent({
        type: '@connect',
        subtype: undefined,
        payload: undefined,
      });

      this._registeringConns.delete((req: any));
    } else {
      connection = this._createConnection();
      connection._setConnected(channel, info || {});
      this._emitConnect(connection);
    }

    this._connectedConns.set(uid, connection);
  };

  _handleDisconnect = ({ uid }: DisconnectBody) => {
    const connection = this._connectedConns.get(uid);
    if (connection !== undefined) {
      connection._setDisconnected();
      connection._emitEvent({
        type: '@disconnect',
        subtype: undefined,
        payload: undefined,
      });

      this._connectedConns.delete(uid);
      this._emitDisconnect(connection);
    }
  };

  _handleEvent = (body: EventBody) => {
    const { uid, type, subtype, payload } = body;
    const connection = this._connectedConns.get(uid);

    if (connection !== undefined) {
      connection._emitEvent({ type, subtype, payload });
    }
  };

  _handleReject = ({ req, reason }: RejectBody) => {
    if (this._registeringConns.has(req)) {
      this._emitError(new ConnectionError(reason));
      this._registeringConns.delete(req);
    }
  };

  _handleConnectFail = () => {
    const err = new ConnectionError('connect handshake fail');
    this._emitError(err);
  };
}

export default WebClient;
