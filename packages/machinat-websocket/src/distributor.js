// @flow
import type { MachinatUser } from 'machinat/types';
import type {
  EventOrder,
  ConnectionId,
  ChannelUid,
  SocketBroker,
  RemoteTarget,
  WebSocketChannel,
} from './types';
import type Socket from './socket';
import type Connection from './connection';
import type { TopicScopeChannel } from './channel';

import { WEBSOCKET } from './constant';

class Distributor {
  serverId: string;
  _broker: SocketBroker;
  _errorHandler: Error => void;

  _channelsConnected: Map<ChannelUid, Set<ConnectionId>>;
  _connectionsStore: Map<
    ConnectionId,
    {
      connection: Connection,
      user: null | MachinatUser,
      socket: Socket,
      channels: Set<ChannelUid>,
    }
  >;

  constructor(
    serverId: string,
    broker: SocketBroker,
    handleError: Error => void
  ) {
    this.serverId = serverId;
    this._broker = broker;
    this._channelsConnected = new Map();
    this._connectionsStore = new Map();
    this._errorHandler = handleError;

    broker.onRemoteEvent(this._handleRemoteEvent);
  }

  addLocalConnection(
    socket: Socket,
    user: null | MachinatUser,
    connection: Connection
  ): boolean {
    const connId = connection.id;
    if (this._connectionsStore.has(connId)) {
      return false;
    }

    this._connectionsStore.set(connId, {
      socket,
      connection,
      user,
      channels: new Set(),
    });
    return true;
  }

  removeLocalConnection({ id: connId }: Connection): boolean {
    const status = this._connectionsStore.get(connId);
    if (status === undefined) {
      return false;
    }

    if (status.channels) {
      this._detachFromChannels(connId, status.channels);
    }

    this._connectionsStore.delete(connId);
    return true;
  }

  async attachTopic(
    connection: Connection,
    scope: TopicScopeChannel
  ): Promise<boolean> {
    if (this.serverId !== connection.serverId) {
      return this._broker.attachTopicRemote(connection, scope);
    }

    const connStatus = this._connectionsStore.get(connection.id);
    if (connStatus === undefined) {
      return false;
    }

    const { uid } = scope;
    connStatus.channels.add(uid);

    let connected = this._channelsConnected.get(uid);
    if (connected === undefined) {
      connected = new Set();
      this._channelsConnected.set(uid, connected);
    }

    connected.add(connection.id);
    return true;
  }

  async detachTopic(
    connection: Connection,
    scope: TopicScopeChannel
  ): Promise<boolean> {
    if (this.serverId !== connection.serverId) {
      return this._broker.detachTopicRemote(connection, scope);
    }

    const connStatus = this._connectionsStore.get(connection.id);
    if (connStatus === undefined) {
      return false;
    }

    const { uid } = scope;
    const connected = this._channelsConnected.get(uid);
    if (connected === undefined) {
      return true;
    }

    connected.delete(connection.id);
    if (connected.size === 0) {
      this._channelsConnected.delete(uid);
    }

    return true;
  }

  async send(
    scope: WebSocketChannel,
    order: EventOrder
  ): Promise<null | Connection[]> {
    if (scope.platform === WEBSOCKET && scope.type === 'connection') {
      const { serverId, id: connId } = scope.connection;

      if (serverId !== this.serverId) {
        return this._broker.sendRemote(
          { type: 'connection', serverId, connId },
          order
        );
      }

      return this._sendToLocalConn(connId, order);
    }

    if (scope.platform === WEBSOCKET && scope.type === 'user') {
      throw new Error('sending to user scope is not yet implemented');
    }

    const [localResults, remoteResults] = await Promise.all([
      this._sendLocal(scope.uid, order),
      this._broker.sendRemote({ type: 'topic', uid: scope.uid }, order),
    ]);

    return localResults === null
      ? remoteResults
      : remoteResults === null
      ? localResults
      : [...localResults, ...remoteResults];
  }

  async disconnect(conn: Connection, reason: string) {
    const connId = conn.id;
    const connStatus = this._connectionsStore.get(connId);
    if (connStatus === undefined) {
      return this._broker.disconnectRemote(conn);
    }

    const { socket, channels } = connStatus;

    this._detachFromChannels(connId, channels);
    this._connectionsStore.delete(connId);
    await socket.disconnect({ connId, reason });

    return true;
  }

  _detachFromChannels(connId: ConnectionId, channels: Set<ChannelUid>): number {
    let count = 0;
    for (const uid of channels) {
      const connected = this._channelsConnected.get(uid);

      if (connected !== undefined && connected.delete(connId)) {
        count += 1;

        if (connected.size === 0) {
          this._channelsConnected.delete(uid);
        }
      }
    }
    return count;
  }

  async _sendToLocalConn(connId: ConnectionId, order: EventOrder) {
    const connStatus = this._connectionsStore.get(connId);
    if (connStatus === undefined) {
      return null;
    }

    const { socket, connection } = connStatus;
    const { type, subtype, payload } = order;

    await socket.event({
      connId,
      type,
      subtype,
      payload,
    });

    return [connection];
  }

  async _sendLocal(
    scopeUId: ChannelUid,
    order: EventOrder
  ): Promise<null | Connection[]> {
    const conneted = this._channelsConnected.get(scopeUId);
    if (conneted === undefined) {
      return null;
    }

    const {
      type,
      subtype,
      payload,
      only: whitelist,
      except: blacklist,
    } = order;

    const whiteSet = whitelist && new Set(whitelist);
    const blackSet = blacklist && new Set(blacklist);

    const promises = [];
    const sentConns = [];
    for (const connId of conneted) {
      // send event and collect promises and ids
      const connStatus = this._connectionsStore.get(connId);

      if (connStatus === undefined) {
        conneted.delete(connId);
      } else if (
        (!whiteSet || whiteSet.has(connId)) &&
        (!blackSet || !blackSet.has(connId))
      ) {
        const { connection, socket } = connStatus;

        promises.push(
          socket
            .event({ connId, type, subtype, payload, scopeUId })
            .catch(this._errorHandler)
        );
        sentConns.push(connection);
      }
    }

    const results = await Promise.all(promises);
    const connsFinished: Connection[] = [];

    for (let i = 0; i < results.length; i += 1) {
      const connection = sentConns[i];

      if (results[i] === undefined) {
        const connId = connection.id;
        // remove errored connection
        conneted.delete(connId);
        this._connectionsStore.delete(connId);
      } else {
        connsFinished.push(connection);
      }
    }

    return connsFinished.length > 0 ? connsFinished : null;
  }

  _handleRemoteEvent(target: RemoteTarget, order: EventOrder) {
    if (target.type === 'connection') {
      if (target.serverId === this.serverId) {
        this._sendToLocalConn(target.connId, order).catch(this._errorHandler);
      }
    } else if (target.type === 'topic') {
      this._sendLocal(target.uid, order).catch(this._errorHandler);
    } else {
      throw new Error(`unknown target received ${target.type}`);
    }
  }
}

export default Distributor;
