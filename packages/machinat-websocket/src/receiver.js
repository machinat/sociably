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
  Connection,
  ConnectionId,
  WebSocketEvent,
  WebSocketMetadata,
  WebSocketBotOptions,
  WebSocketResponse,
} from './types';
import type Distributor from './distributor';
import type Socket, {
  EventBody,
  RegisterBody,
  ConnectBody,
  DisconnectBody,
} from './socket';
import type { WebSocketChannel } from './channel';

import MachinatSocket from './socket';
import { socketChannel, connectionChannel } from './channel';
import createEvent from './event';
import { WEBSOCKET } from './constant';

type WebSocketServer = $ElementType<WebSocket, 'Server'>;

type SocketStatus = {|
  lostHeartbeatCount: number,
  connsCounter: number,
  connections: Map<ConnectionId, Connection>,
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
    webSocketServer: WebSocketServer,
    distributor: Distributor,
    options: WebSocketBotOptions
  ) {
    super();

    this.options = options;
    this._webSocketServer = webSocketServer;
    this._distributor = distributor;
    this._socketStore = new Map();

    const self = this;
    this._handleSocketEvent = function handleSocketEvent(body) {
      self._handleEvent(this, body).catch(this._handleErrer);
    };

    this._handleSocketRegister = function handleSocketRegistry(body, seq) {
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
      const socket = new MachinatSocket(ws, uniqid(), requestInfo);
      this._socketStore.set(socket, {
        lostHeartbeatCount: 0,
        connsCounter: 0,
        connections: new Map(),
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
    if (!socketStatus) {
      const reason = 'unknown socket';
      socket.close(3404, reason);
      throw new Error(reason);
    }

    return socketStatus;
  }

  _processEvent(
    socket: Socket,
    channel: WebSocketChannel,
    user: ?MachinatUser,
    event: WebSocketEvent
  ) {
    return this.issueEvent(channel, user, event, {
      source: WEBSOCKET,
      socketId: socket.id,
      request: (socket.request: any), // request exist at server side
    });
  }

  _handleRegister = async (socket: Socket, body: RegisterBody, seq: number) => {
    const channel = socketChannel(socket.id);
    const event = createEvent('@authenticate', undefined, body);

    try {
      const response = await this._processEvent(socket, channel, null, event);

      if (response && response.accepted) {
        const { user } = response;
        const socketStatus = this._getSocketStatusAssertedly(socket);
        socketStatus.connsCounter += 1;

        const { connections, connsCounter } = socketStatus;
        const connectionId = `${socket.id}#${connsCounter}`;
        connections.set(connectionId, {
          id: connectionId,
          socket,
          user,
          channel: connectionChannel(connectionId),
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
    const connection = socketStatus.connections.get(connectionId);

    if (connection === undefined) {
      // reject if not registered
      await socket.disconnect({
        connectionId,
        reason: 'connection not found',
      });
    } else {
      const { user, channel } = connection;
      await this._processEvent(
        socket,
        channel,
        user,
        createEvent(type, subtype, payload)
      );
    }
  };

  _handleConnect = async (socket: Socket, body: ConnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connectionId } = body;
    const connection = socketStatus.connections.get(connectionId);

    if (connection === undefined) {
      // reject if not registered
      await socket.disconnect({
        connectionId,
        reason: 'connection not registered',
      });
    } else {
      this._distributor.addLocalConnection(connection);
      const { user, channel } = connection;

      await this._processEvent(
        socket,
        channel,
        user,
        createEvent('@connect', undefined, undefined)
      );
    }
  };

  _handleConnectFail = (socket: Socket, body: DisconnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);
    socketStatus.connections.delete(body.connectionId);
  };

  _handleDisconnect = async (socket: Socket, body: DisconnectBody) => {
    const socketStatus = this._getSocketStatusAssertedly(socket);

    const { connectionId } = body;
    const connection = socketStatus.connections.get(connectionId);

    if (connection !== undefined) {
      socketStatus.connections.delete(connectionId);
      this._distributor.removeLocalConnection(connection.id);

      const { user, channel } = connection;
      await this._processEvent(
        socket,
        channel,
        user,
        createEvent('@disconnect', undefined, undefined)
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
