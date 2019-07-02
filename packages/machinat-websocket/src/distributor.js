// @flow
import EventEmitter from 'events';

import type Socket, {
  RegisterBody,
  ConnectBody,
  EventBody,
  DisconnectBody,
} from './socket';
import type {
  WebSocketJob,
  ChannelUid,
  SocketId,
  ConnectionInfo,
  RegisterAuthenticator,
  SocketBroker,
} from './types';

type SocketStatus = {|
  instance: Socket,
  lostHeartbeatCount: number,
|};

type ConnectionStatus = {|
  connected: boolean,
  info: ConnectionInfo,
  resolve: void | (boolean => void),
|};

class SocketDistributor extends EventEmitter {
  _broker: SocketBroker;
  _authenticator: RegisterAuthenticator;

  _socketStore: Map<SocketId, SocketStatus>;
  _connectionMapping: Map<ChannelUid, Map<SocketId, ConnectionStatus>>;

  _handleEvent: (body: EventBody, seq: number) => void;
  _handleRegister: (body: RegisterBody, seq: number) => void;
  _handleConnect: (body: ConnectBody, seq: number) => void;
  _handleDisconnect: (body: DisconnectBody, seq: number) => void;
  _handleConnectFail: (body: DisconnectBody, seq: number) => void;
  _handleSocketClose: (code: number, reason: string) => void;

  constructor(broker: SocketBroker) {
    super();

    this._broker = broker;
    this._socketStore = new Map();
    this._connectionMapping = new Map();

    const distributor = this;

    function handleRegister(body: RegisterBody, seq: number) {
      distributor
        ._handleRegisterImpl((this: Socket), body, seq)
        .catch(this._emitError);
    }

    function handleConnect(body: ConnectBody) {
      distributor
        ._handleConnectImpl((this: Socket), body)
        .catch(this._emitError);
    }

    function handleEvent(body: EventBody) {
      distributor._handleEventImpl((this: Socket), body);
    }

    function handleConnectFail(body: DisconnectBody) {
      distributor._handleConnectFailImpl((this: Socket), body);
    }

    function handleDisconnect(body: DisconnectBody) {
      distributor
        ._handleDisconnectImpl((this: Socket), body)
        .catch(this._emitError);
    }

    function handleSocketClose() {
      distributor._handleSocketCloseImpl((this: Socket));
    }

    this._handleEvent = handleEvent;
    this._handleRegister = handleRegister;
    this._handleConnect = handleConnect;
    this._handleConnectFail = handleConnectFail;
    this._handleDisconnect = handleDisconnect;
    this._handleSocketClose = handleSocketClose;
  }

  consignSocket(socket: Socket): boolean {
    const socketId = socket.id;

    if (this._socketStore.has(socketId)) {
      return false;
    }

    this._socketStore.set(socketId, {
      instance: socket,
      lostHeartbeatCount: 0,
    });

    socket.on('event', this._handleEvent);
    socket.on('register', this._handleRegister);
    socket.on('connect', this._handleConnect);
    socket.on('disconnect', this._handleDisconnect);
    socket.on('close', this._handleSocketClose);

    return true;
  }

  getLocalConnectionInfo(
    uid: ChannelUid,
    socketId: SocketId
  ): void | ConnectionInfo {
    const status = this._getConnectionStatus(uid, socketId);
    if (status === undefined) {
      return undefined;
    }

    return status.connected ? status.info : undefined;
  }

  async connectSocket(
    uid: ChannelUid,
    socketId: SocketId,
    info: ConnectionInfo
  ): Promise<boolean> {
    const socketStatus = this._socketStore.get(socketId);
    if (socketStatus === undefined) {
      const remoteResult = await this._broker.connectRemoteSocket(
        uid,
        socketId,
        info
      );
      return remoteResult;
    }

    const connections = this._connectionMapping.get(uid);
    if (connections !== undefined && connections.has(socketId)) {
      return false;
    }

    const { instance: socket } = socketStatus;

    const finishPromise = new Promise(resolve => {
      this._setLocalConnection(uid, socketId, info, false, resolve);
    });
    await socket.connect({ uid, info });

    const success = await finishPromise;
    return success;
  }

  async disconnectSocket(
    uid: ChannelUid,
    socketId: SocketId,
    reason: string
  ): Promise<boolean> {
    const socketStatus = this._socketStore.get(socketId);
    if (socketStatus === undefined) {
      const remoteResult = await this._broker.disconnectRemoteSocket(
        uid,
        socketId,
        reason
      );
      return remoteResult;
    }

    const status = this._getConnectionStatus(uid, socketId);
    if (status === undefined || !status.connected) {
      return false;
    }

    this._setLocalConnection(uid, socketId, status.info, false);

    const { instance: socket } = socketStatus;
    await socket.disconnect({ uid, reason });

    return true;
  }

  async broadcast(job: WebSocketJob): Promise<null | SocketId[]> {
    const { uid, type, subtype, payload, whitelist, blacklist } = job;

    const conneted = this._connectionMapping.get(uid);
    if (conneted === undefined) {
      // return only remote result if no connected socket at local
      const remoteResult = await this._broker.broadcastRemote(job);
      return remoteResult;
    }

    const whitelistSet = whitelist && new Set(whitelist);
    const blacklistSet = blacklist && new Set(blacklist);

    const promises = [];
    const socketsSent = [];
    // send event and collect promises and ids
    for (const [socketId, status] of conneted) {
      const socketStatus = this._socketStore.get(socketId);

      if (socketStatus === undefined) {
        conneted.delete(socketId);
      } else if (
        status.connected &&
        (!whitelistSet || whitelistSet.has(socketId)) &&
        (!blacklistSet || !blacklistSet.has(socketId))
      ) {
        const { instance: socket } = socketStatus;
        promises.push(
          socket.event({ uid, type, subtype, payload }).catch(this._emitError)
        );
        socketsSent.push(socketId);
      }
    }

    const remoteResult = await this._broker.broadcastRemote(job);
    const localResults = await Promise.all(promises);

    // pick success socket id
    const socketsFinished = [];
    for (let i = 0; i < localResults.length; i += 1) {
      if (localResults[i] !== undefined) {
        socketsFinished.push(socketsSent[i]);
      }
    }

    if (remoteResult !== null) {
      socketsFinished.push(...remoteResult);
    }

    return socketsFinished.length === 0 ? null : socketsFinished;
  }

  setAuthenticator(authenticator: RegisterAuthenticator) {
    this._authenticator = authenticator;
  }

  _getConnectionStatus(uid: ChannelUid, socketId: SocketId) {
    const conneted = this._connectionMapping.get(uid);
    if (conneted === undefined) {
      return undefined;
    }

    return conneted.get(socketId);
  }

  async _deleteSocket(
    socketId: SocketId,
    code: number,
    reason: string
  ): Promise<void> {
    const socketStatus = this._socketStore.get(socketId);
    if (socketStatus !== undefined) {
      this._socketStore.delete(socketId);

      const { instance: socket } = socketStatus;
      socket.close(code, reason);
    }
  }

  _deleteLocalConnection(socketId: SocketId, uid: ChannelUid): boolean {
    const connections = this._connectionMapping.get(uid);
    if (connections === undefined) {
      return false;
    }

    if (connections.delete(socketId)) {
      if (connections.size === 0) {
        this._connectionMapping.delete(uid);
      }

      return true;
    }

    return false;
  }

  _emitError = (err: Error) => {
    this.emit('error', err);
  };

  _emitEvent(
    uid: ChannelUid,
    socket: Socket,
    info: ConnectionInfo,
    body: EventBody
  ) {
    this.emit('event', uid, socket, info, body);
  }

  _emitConnect(uid: ChannelUid, socket: Socket, info: ConnectionInfo) {
    this.emit('connect', uid, socket, info);
  }

  _emitDisconnect(uid: ChannelUid, socket: Socket, info: ConnectionInfo) {
    this.emit('disconnect', uid, socket, info);
  }

  _setLocalConnection(
    uid: ChannelUid,
    socketId: SocketId,
    info: ConnectionInfo,
    connected: boolean,
    resolve?: boolean => void
  ) {
    let connections = this._connectionMapping.get(uid);
    if (connections === undefined) {
      connections = new Map();
      this._connectionMapping.set(uid, connections);
    }

    connections.set(socketId, { connected, info, resolve });
    return true;
  }

  async _handleRegisterImpl(socket: Socket, body: RegisterBody, seq: number) {
    const result = await this._authenticator(socket, body);

    if (result.accepted) {
      const { channel, info } = result;
      const uid: ChannelUid = (channel.uid: any);

      await socket.connect({ uid, req: seq, info });
      this._setLocalConnection(uid, socket.id, info || {}, false);
    } else {
      await socket.reject({ req: seq, reason: result.reason });
    }
  }

  async _handleConnectImpl(socket: Socket, body: ConnectBody) {
    const { uid } = body;

    const connections = this._connectionMapping.get(uid);

    if (connections === undefined || !connections.has(socket.id)) {
      // reject if not registered
      await socket.disconnect({ uid, reason: 'connection not registered' });
    } else {
      const { resolve, info }: ConnectionStatus = (connections.get(
        socket.id
      ): any);
      if (resolve !== undefined) {
        resolve(true);
      }

      this._setLocalConnection(uid, socket.id, info, true);
      this._emitConnect(uid, socket, info);
      await this._broker.updateConnected(uid, socket.id, info);
    }
  }

  _handleConnectFailImpl(socket: Socket, body: DisconnectBody) {
    const { uid } = body;

    const connections = this._connectionMapping.get(uid);

    if (connections !== undefined && connections.has(socket.id)) {
      const status: ConnectionStatus = (connections.get(socket.id): any);

      if (status.resolve !== undefined) {
        status.resolve(false);
      }
    }

    this._deleteLocalConnection(socket.id, uid);
  }

  async _handleDisconnectImpl(socket: Socket, body: DisconnectBody) {
    const { uid } = body;
    const status = this._getConnectionStatus(uid, socket.id);
    if (status === undefined) {
      return;
    }

    this._deleteLocalConnection(socket.id, uid);
    this._emitDisconnect(uid, socket, status.info);
    await this._broker.updateDisconnected(uid, socket.id);
  }

  _handleEventImpl(socket: Socket, body: EventBody) {
    const { uid } = body;
    const status = this._getConnectionStatus(uid, socket.id);
    if (status === undefined || !status.connected) {
      return;
    }

    this._emitEvent(uid, socket, status.info, body);
  }

  _handleSocketCloseImpl(socket: Socket) {
    socket.removeAllListeners();
    this._socketStore.delete(socket.id);
  }
}

export default SocketDistributor;