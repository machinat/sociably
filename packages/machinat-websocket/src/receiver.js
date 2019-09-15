// @flow
import http from 'http';
import uniqid from 'uniqid';
import { BaseReceiver } from 'machinat-base';

import type { MachinatUser } from 'machinat/types';
import type WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { HTTPUpgradeReceiver } from 'machinat-http-adaptor/types';
import type {
  ConnectionId,
  WebSocketEvent,
  WebSocketMetadata,
  WebSocketBotOptions,
  WebSocketResponse,
  WebSocketChannel,
} from './types';
import type Distributor from './distributor';
import type Socket, {
  EventBody,
  RegisterBody,
  ConnectBody,
  DisconnectBody,
} from './socket';
import Connection from './connection';

import MachinatSocket from './socket';
import { connectionScope } from './channel';
import createEvent from './event';
import { WEBSOCKET } from './constant';

type WebSocketServer = $ElementType<WebSocket, 'Server'>;

type SocketStatus = {|
  lostHeartbeat: number,
  connsAuthInfo: Map<
    ConnectionId,
    { user: null | MachinatUser, tags: null | string[] }
  >,
|};

const rejectUpgrade = (ns: NetSocket, code: number, message?: string) => {
  const codeName = http.STATUS_CODES[code];
  const body = message || codeName;

  ns.write(
    `HTTP/1.1 ${code} ${codeName}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/html\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      `\r\n${body}`
  );

  ns.destroy();
};

class WebSocketReceiver
  extends BaseReceiver<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata,
    WebSocketResponse
  >
  implements HTTPUpgradeReceiver {
  options: WebSocketBotOptions;
  _serverId: string;
  _webSocketServer: WebSocketServer;
  _distributor: Distributor;
  _socketStore: Map<Socket, SocketStatus>;

  _handleSocketEvent: (body: EventBody, seq: number) => void;
  _handleSocketRegister: (body: RegisterBody, seq: number) => void;
  _handleSocketConnect: (body: ConnectBody, seq: number) => void;
  _handleSocketConnectFail: (body: DisconnectBody, seq: number) => void;
  _handleSocketDisconnect: (body: DisconnectBody, seq: number) => void;
  _handleSocketClose: (code: number, reason: string) => void;

  constructor(
    serverId: string,
    webSocketServer: WebSocketServer,
    distributor: Distributor,
    options: WebSocketBotOptions
  ) {
    super();

    this.options = options;
    this._serverId = serverId;
    this._webSocketServer = webSocketServer;
    this._distributor = distributor;
    this._socketStore = new Map();

    const self = this;
    this._handleSocketEvent = function handleSocketEvent(body) {
      self._handleEvent(this, body).catch(this._handleErrer);
    };

    this._handleSocketRegister = function handleSocketRegister(body, seq) {
      self._handleRegister(this, body, seq).catch(this._handleErrer);
    };

    this._handleSocketConnect = function handleSocketConnect(body) {
      self._handleConnect(this, body).catch(this._handleErrer);
    };

    this._handleSocketConnectFail = function handleSocketConnectFail(body) {
      self._handleConnectFail(this, body);
    };

    this._handleSocketDisconnect = function handleSocketDisconnect(body) {
      self._handleDisconnect(this, body);
    };

    this._handleSocketClose = function handleSocketClose() {
      self._handleClose(this);
    };
  }

  handleUpgrade(req: IncomingMessage, ns: NetSocket, head: Buffer) {
    const requestInfo = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      encrypted: !!(req: any).connection.encrypted,
    };

    if (this.options.verifyUpgrade) {
      const allowed = this.options.verifyUpgrade(requestInfo);

      if (!allowed) {
        rejectUpgrade(ns, 400);
        return;
      }
    }

    this._webSocketServer.handleUpgrade(req, ns, head, (ws: WebSocket) => {
      const socket = new MachinatSocket(uniqid(), ws, requestInfo);
      this._socketStore.set(socket, {
        lostHeartbeat: 0,
        connsAuthInfo: new Map(),
      });

      socket.on('event', this._handleSocketEvent);
      socket.on('register', this._handleSocketRegister);
      socket.on('connect', this._handleSocketConnect);
      socket.on('connect_fail', this._handleSocketConnectFail);
      socket.on('disconnect', this._handleSocketDisconnect);
      socket.on('close', this._handleSocketClose);
      socket.on('error', this._handleError);
    });
  }

  callback() {
    return this.handleUpgrade.bind(this);
  }

  _getSocketStatusAssertedly(socket: Socket) {
    const socketStatus = this._socketStore.get(socket);
    if (socketStatus === undefined) {
      const reason = 'unknown socket';
      socket.close(3404, reason);
      throw new Error(reason);
    }

    return socketStatus;
  }

  _processEvent(socket: Socket, connection: Connection, event: WebSocketEvent) {
    return this.issueEvent(
      connectionScope(connection),
      connection.user,
      event,
      {
        source: WEBSOCKET,
        request: (socket.request: any), // request exist at server side
        connection,
      }
    );
  }

  _handleRegister = async (socket: Socket, body: RegisterBody, seq: number) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);
    const connectionId: string = uniqid();

    try {
      const response = await this._processEvent(
        socket,
        new Connection(this._serverId, socket.id, connectionId, null, null),
        createEvent('@auth', undefined, body)
      );

      if (response && response.accepted) {
        const { user } = response;

        socketStatus.connsAuthInfo.set(connectionId, {
          user,
          tags: null,
        });
        await socket.connect({ connectionId, req: seq, user });
      } else {
        await socket.reject({
          req: seq,
          reason: response ? response.reason : 'no matched auth method',
        });
      }
    } catch (err) {
      await socket.reject({ req: seq, reason: err.message });
    }
  };

  _handleEvent = async (socket: Socket, body: EventBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connectionId, type, subtype, payload } = body;
    const authInfo = socketStatus.connsAuthInfo.get(connectionId);

    if (authInfo === undefined) {
      // reject if not registered
      await socket.disconnect({
        connectionId,
        reason: 'connection not registered',
      });
    } else {
      const { user, tags } = authInfo;
      await this._processEvent(
        socket,
        new Connection(this._serverId, socket.id, connectionId, user, tags),
        createEvent(type, subtype, payload)
      );
    }
  };

  _handleConnect = async (socket: Socket, body: ConnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connectionId } = body;
    const authInfo = socketStatus.connsAuthInfo.get(connectionId);

    if (authInfo === undefined) {
      // reject if not registered
      await socket.disconnect({
        connectionId,
        reason: 'connection not registered',
      });
    } else {
      const { user, tags } = authInfo;
      const connection = new Connection(
        this._serverId,
        socket.id,
        connectionId,
        user,
        tags
      );
      this._distributor.addLocalConnection(socket, connection);

      await this._processEvent(
        socket,
        connection,
        createEvent('@connect', undefined, undefined)
      );
    }
  };

  _handleConnectFail = (socket: Socket, body: DisconnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);
    socketStatus.connsAuthInfo.delete(body.connectionId);
  };

  _handleDisconnect = async (socket: Socket, body: DisconnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connectionId, reason } = body;
    const authInfo = socketStatus.connsAuthInfo.get(connectionId);

    if (authInfo !== undefined) {
      const { user, tags } = authInfo;
      const connection = new Connection(
        this._serverId,
        socket.id,
        connectionId,
        user,
        tags
      );

      socketStatus.connsAuthInfo.delete(connectionId);
      this._distributor.removeLocalConnection(connection);

      await this._processEvent(
        socket,
        connection,
        createEvent('@disconnect', undefined, { reason })
      );
    }
  };

  _handleClose = (socket: Socket) => {
    socket.removeAllListeners();
    this._socketStore.delete(socket);
  };

  _handleError = (err: Error) => {
    this.issueError(err);
  };
}

export default WebSocketReceiver;
