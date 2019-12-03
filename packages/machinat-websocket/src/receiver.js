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
  WebSocketChannel,
  RequestInfo,
  ServerAuthenticatorFunc,
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
import { ConnectionChannel } from './channel';
import createEvent from './event';
import { WEBSOCKET } from './constant';

type WebSocketServer = $ElementType<WebSocket, 'Server'>;

type ConnectionInfo = {
  connection: Connection,
  user: null | MachinatUser,
  authContext: any,
};

type SocketStatus = {|
  lostHeartbeat: number,
  connected: Map<ConnectionId, ConnectionInfo>,
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

class WebSocketReceiver<AuthContext, RegisterData>
  extends BaseReceiver<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata<AuthContext>,
    void
  >
  implements HTTPUpgradeReceiver {
  _serverId: string;
  _webSocketServer: WebSocketServer;
  _distributor: Distributor;

  _verifyUpgrade: (request: RequestInfo) => boolean;
  _authenticator: ServerAuthenticatorFunc<AuthContext, RegisterData>;

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
    authenticator: ServerAuthenticatorFunc<AuthContext, RegisterData>,
    verifyUpgrade: (request: RequestInfo) => boolean
  ) {
    super();

    this._serverId = serverId;
    this._webSocketServer = webSocketServer;
    this._distributor = distributor;
    this._socketStore = new Map();

    this._verifyUpgrade = verifyUpgrade;
    this._authenticator = authenticator;

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

    const allowed = this._verifyUpgrade(requestInfo);
    if (!allowed) {
      rejectUpgrade(ns, 400);
      return;
    }

    this._webSocketServer.handleUpgrade(req, ns, head, (ws: WebSocket) => {
      const socket = new MachinatSocket(uniqid(), ws, requestInfo);
      this._socketStore.set(socket, {
        lostHeartbeat: 0,
        connected: new Map(),
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

  _processEvent(
    socket: Socket,
    event: WebSocketEvent,
    authenticated: ConnectionInfo
  ) {
    const { connection, user, authContext } = authenticated;
    return this.issueEvent(new ConnectionChannel(connection), user, event, {
      source: WEBSOCKET,
      request: socket.request,
      connection,
      authContext,
    });
  }

  _handleRegister = async (socket: Socket, body: RegisterBody, seq: number) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);
    const connId: string = uniqid();

    try {
      const authed = await this._authenticator(socket.request, body.data);

      if (authed.accepted) {
        const { user, context: authContext, expireAt } = authed;
        socketStatus.connected.set(connId, {
          user,
          authContext,
          connection: new Connection(
            this._serverId,
            socket.id,
            connId,
            expireAt
          ),
        });

        await socket.connect({ connId, seq });
      } else {
        await socket.reject({ seq, reason: authed.reason });
      }
    } catch (err) {
      await socket.reject({ seq, reason: err.message });
    }
  };

  _handleEvent = async (socket: Socket, body: EventBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connId, type, subtype, payload } = body;
    const authenticated = socketStatus.connected.get(connId);

    if (authenticated === undefined) {
      // reject if not registered
      await socket.disconnect({
        connId,
        reason: 'connection is not authenticated',
      });
    } else {
      await this._processEvent(
        socket,
        createEvent(type, subtype, payload),
        authenticated
      );
    }
  };

  _handleConnect = async (socket: Socket, body: ConnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connId } = body;
    const authenticated = socketStatus.connected.get(connId);

    if (authenticated === undefined) {
      // reject if not registered
      await socket.disconnect({
        connId,
        reason: 'connection is not authenticated',
      });
    } else {
      const { connection, user } = authenticated;
      this._distributor.addLocalConnection(socket, user, connection);

      await this._processEvent(
        socket,
        createEvent('connect', undefined, undefined),
        authenticated
      );
    }
  };

  _handleConnectFail = (socket: Socket, body: DisconnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);
    socketStatus.connected.delete(body.connId);
  };

  _handleDisconnect = async (socket: Socket, body: DisconnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connId, reason } = body;
    const authenticated = socketStatus.connected.get(connId);

    if (authenticated !== undefined) {
      const { connection } = authenticated;

      socketStatus.connected.delete(connId);
      this._distributor.removeLocalConnection(connection);

      await this._processEvent(
        socket,
        createEvent('disconnect', undefined, { reason }),
        authenticated
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
