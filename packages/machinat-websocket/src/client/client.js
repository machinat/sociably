// @flow
import EventEmitter from 'events';

import type MachinatSocket, {
  ConnectBody,
  DisconnectBody,
  EventBody,
  RegisterBody,
  RejectBody,
} from '../socket';

import WebSocketChannel from '../channel';
import { ConnectionError } from '../error';

import createSocket from './createSocket';
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
  resolve: number => void,
  reject: any => void,
};

type ConnectionHandler = (
  connection: Connection,
  channel: WebSocketChannel
) => void;

class WebClient extends EventEmitter {
  options: ClientOptions;
  _socket: MachinatSocket;

  _queuedRegister: QueuedRegisterJob[];

  _registeringConns: Map<number, Connection>;
  _connectedConns: Map<string, Connection>;

  _connectionHandlers: ConnectionHandler[];
  _errorHandlers: ((Error) => void)[];

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

    this._connectionHandlers = [];
    this._errorHandlers = [];

    this._socket = createSocket(options.url);

    this._socket.on('open', this._flushRegister);
    this._socket.on('close', this._clearAllConnections);

    this._socket.on('connect', this._handleConnect);
    this._socket.on('disconnect', this._handleDisconnect);
    this._socket.on('event', this._handleEvent);

    this._socket.on('reject', this._handleReject);
    this._socket.on('error', this._emitError);
    this._socket.on('connect_fail', this._handleConnectFail);

    // this._socket.on('answer');
  }

  _sendRegister(body: RegisterBody, connection: Connection): Promise<number> {
    if (!this._socket.isReady()) {
      return new Promise((resolve, reject) => {
        this._queuedRegister.push({ body, connection, resolve, reject });
      });
    }

    return this._socket.register(body);
  }

  register(body: RegisterBody): Connection {
    const connection = this._createConnection();

    this._sendRegister(body, connection)
      .then(registerSeq => {
        this._registeringConns.set(registerSeq, connection);
      })
      .catch(this._emitError);

    return connection;
  }

  _createConnection() {
    const connection = new Connection(
      async (event: ClientEvent) => {
        const channel = connection._channel;
        if (channel === undefined) {
          throw new ConnectionError();
        }

        await this._socket.event({ uid: channel.uid, ...event });
      },
      async () => {
        if (connection._channel !== undefined) {
          const { uid } = connection._channel;
          await this._socket.disconnect({ uid });
        }
      }
    );

    return connection;
  }

  onConnected(handler: ConnectionHandler) {
    this._connectionHandlers.push(handler);
  }

  removeConnectedHandler(handler: ConnectionHandler) {
    const idx = this._connectionHandlers.findIndex(fn => fn === handler);
    if (idx === -1) {
      return false;
    }

    this._connectionHandlers.splice(idx, 1);
    return true;
  }

  _emitConnected(connection: Connection, channel: WebSocketChannel) {
    for (const handler of this._connectionHandlers) {
      handler(connection, channel);
    }
  }

  onError(handler: Error => void) {
    this._errorHandlers.push(handler);
  }

  removeErrorHandler(handler: Error => void) {
    const idx = this._errorHandlers.findIndex(fn => fn === handler);
    if (idx === -1) {
      return false;
    }

    this._errorHandlers.splice(idx, 1);
    return true;
  }

  _emitError = (err: Error) => {
    for (const handler of this._errorHandlers) {
      handler(err);
    }
  };

  _flushRegister = () => {
    for (const { body, resolve, reject } of this._queuedRegister) {
      this._socket
        .register(body)
        .then(resolve)
        .catch(reject);
    }

    this._queuedRegister = [];
  };

  _clearAllConnections = () => {
    const err = new ConnectionError();
    for (const connection of this._registeringConns.values()) {
      connection._failAllEventsJob(err);
    }
    this._registeringConns = new Map();

    for (const connection of this._connectedConns.values()) {
      connection._setDisconnected();
    }
    this._connectedConns = new Map();
  };

  _handleConnect = ({ uid, req }: ConnectBody, seq: number) => {
    const channel = WebSocketChannel.fromUid(uid);
    if (channel === null) {
      this._socket.reject({ req: seq }).catch(this._emitError);
      return;
    }

    let connection = this._registeringConns.get((req: any));
    if (connection !== undefined) {
      connection._setConnected(channel);
      connection._emitEvent(
        { type: 'connect', subtype: undefined, payload: undefined },
        channel
      );

      this._registeringConns.delete((req: any));
    } else {
      connection = this._createConnection();
      connection._setConnected(channel);
      this._emitConnected(connection, channel);
    }

    this._connectedConns.set(uid, connection);
  };

  _handleDisconnect = ({ uid }: DisconnectBody) => {
    const connection = this._connectedConns.get(uid);
    if (connection !== undefined) {
      const channel: WebSocketChannel = (connection.channel: any);

      connection._setDisconnected();
      connection._emitEvent(
        { type: 'disconnect', subtype: undefined, payload: undefined },
        channel
      );

      this._connectedConns.delete(uid);
    }
  };

  _handleEvent = (body: EventBody) => {
    const { uid, type, subtype, payload } = body;
    const connection = this._connectedConns.get(uid);

    if (connection !== undefined) {
      const channel: WebSocketChannel = (connection.channel: any);
      connection._emitEvent({ type, subtype, payload }, channel);
    }
  };

  _handleReject = ({ req }: RejectBody) => {
    if (this._registeringConns.has(req)) {
      this._emitError(new ConnectionError());
      this._registeringConns.delete(req);
    }
  };

  _handleConnectFail = (body: DisconnectBody) => {
    const err = new ConnectionError();
    this._emitError(err);
  };
}

export default WebClient;
