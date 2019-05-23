// @flow
import EventEmitter from 'events';

import type Socket, {
  RegisterBody,
  ConnectBody,
  EventBody,
  DisconnectBody,
} from './socket';
import type {
  WebEventJob,
  ChannelUid,
  SocketId,
  ConnectionInfo,
  RegisterAuthenticator,
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
  _authenticator: RegisterAuthenticator;

  _socketStore: Map<SocketId, SocketStatus>;
  _connectionMapping: Map<ChannelUid, Map<SocketId, ConnectionStatus>>;

  _handleEvent: (body: EventBody, seq: number) => void;
  _handleRegister: (body: RegisterBody, seq: number) => void;
  _handleConnect: (body: ConnectBody, seq: number) => void;
  _handleDisconnect: (body: DisconnectBody, seq: number) => void;
  _handleConnectFail: (body: DisconnectBody, seq: number) => void;
  _handleSocketClose: (code: number, reason: string) => void;

  constructor() {
    super();

    this._socketStore = new Map();
    this._connectionMapping = new Map();

    const broker = this;

    function handleRegister(body: RegisterBody, seq: number) {
      broker
        ._handleRegisterImpl((this: Socket), body, seq)
        .catch(this._emitError);
    }

    function handleConnect(body: ConnectBody) {
      broker._handleConnectImpl((this: Socket), body).catch(this._emitError);
    }

    function handleEvent(body: EventBody) {
      broker._handleEventImpl((this: Socket), body);
    }

    function handleConnectFail(body: DisconnectBody) {
      broker._handleConnectFailImpl((this: Socket), body);
    }

    function handleDisconnect(body: DisconnectBody) {
      broker._handleDisconnectImpl((this: Socket), body);
    }

    function handleSocketClose() {
      broker._handleSocketCloseImpl((this: Socket));
    }

    this._handleEvent = handleEvent;
    this._handleRegister = handleRegister;
    this._handleConnect = handleConnect;
    this._handleConnectFail = handleConnectFail;
    this._handleDisconnect = handleDisconnect;
    this._handleSocketClose = handleSocketClose;
  }

  addSocket(socket: Socket): boolean {
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

  async removeSocket(socketId: SocketId): Promise<number> {
    const socketStatus = this._socketStore.get(socketId);

    if (socketStatus === undefined) {
      return 0;
    }

    this._socketStore.delete(socketId);

    const { instance: socket } = socketStatus;
    let unboundCount = 0;

    for (const uid of socket.connectStates.keys()) {
      const conneted = this._connectionMapping.get(uid);

      if (conneted !== undefined && conneted.delete(socketId)) {
        unboundCount += 1;
      }
    }

    return unboundCount;
  }

  async addLocalConnection(
    socketId: SocketId,
    uid: ChannelUid,
    info: ConnectionInfo
  ): Promise<boolean> {
    const socketStatus = this._socketStore.get(socketId);
    if (socketStatus === undefined) {
      return false;
    }

    const connections = this._connectionMapping.get(uid);
    if (connections !== undefined && connections.has(socketId)) {
      return false;
    }

    const { instance: socket } = socketStatus;

    await socket.connect({ uid });
    const success = await new Promise(resolve => {
      this._setLocalConnection(uid, socketId, info, false, resolve);
    });

    return success;
  }

  async removeLocalConnection(
    socketId: SocketId,
    uid: ChannelUid,
    reason: string
  ): Promise<boolean> {
    if (this._deleteLocalConnection(socketId, uid)) {
      const socketStatus = this._socketStore.get(socketId);
      if (socketStatus === undefined) {
        return false;
      }

      const { instance: socket } = socketStatus;
      await socket.disconnect({ uid, reason });

      return true;
    }

    return false;
  }

  async broadcast({
    body,
    whitelist,
    blacklist,
  }: WebEventJob): Promise<null | SocketId[]> {
    const { uid } = body;
    const conneted = this._connectionMapping.get(uid);

    if (conneted === undefined) {
      return null;
    }

    const whitelistSet = whitelist && new Set(whitelist);
    const blacklistSet = blacklist && new Set(blacklist);

    const promises = [];
    const socketsSent = [];

    for (const socketId of conneted.keys()) {
      const socketStatus = this._socketStore.get(socketId);

      if (socketStatus === undefined) {
        conneted.delete(socketId);
      } else if (
        (!whitelistSet || whitelistSet.has(socketId)) &&
        (!blacklistSet || blacklistSet.has(socketId))
      ) {
        const { instance: socket } = socketStatus;
        promises.push(socket.event(body).catch(this._emitError));
        socketsSent.push(socketId);
      }
    }

    const results = await Promise.all(promises);

    const socketsFinished = [];
    for (let i = 0; i < results.length; i += 1) {
      if (results[i] !== undefined) {
        socketsFinished.push(socketsSent[i]);
      }
    }

    return socketsFinished;
  }

  setAuthenticator(authenticator: RegisterAuthenticator) {
    this._authenticator = authenticator;
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
    socket: Socket,
    uid: ChannelUid,
    info: ConnectionInfo,
    body: EventBody
  ) {
    this.emit('event', socket, uid, info, body);
  }

  _emitConnect(socket: Socket, uid: ChannelUid, info: ConnectionInfo) {
    this.emit('connect', socket, uid, info);
  }

  _emitDisconnect(socket: Socket, uid: ChannelUid, info: ConnectionInfo) {
    this.emit('disconnect', socket, uid, info);
  }

  _getLocalConnectionInfo(
    socketId: SocketId,
    uid: ChannelUid
  ): void | ConnectionInfo {
    const conneted = this._connectionMapping.get(uid);
    if (conneted === undefined) {
      return undefined;
    }

    const status = conneted.get(socketId);
    if (status === undefined) {
      return undefined;
    }

    return status.info;
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

      await socket.connect({ uid, req: seq });
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
      this._emitConnect(socket, uid, info);
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

  _handleDisconnectImpl(socket: Socket, body: DisconnectBody) {
    const { uid } = body;
    const info = this._getLocalConnectionInfo(socket.id, uid);
    if (info === undefined) {
      return;
    }

    this._deleteLocalConnection(socket.id, uid);
    this._emitDisconnect(socket, uid, info);
  }

  _handleEventImpl(socket: Socket, body: EventBody) {
    const { uid } = body;
    const info = this._getLocalConnectionInfo(socket.id, uid);
    if (info === undefined) {
      return;
    }

    this._emitEvent(socket, uid, info, body);
  }

  _handleSocketCloseImpl(socket: Socket) {
    this.removeSocket(socket.id);
  }
}

export default SocketDistributor;
