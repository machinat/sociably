// @flow
import type {
  EventOrder,
  ConnectionId,
  ChannelUid,
  SocketBroker,
  RemoteTarget,
  WebSocketChannel,
  TopicScope,
} from './types';
import type Socket from './socket';
import type Connection from './connection';

import { WEBSOCKET } from './constant';

class Distributor {
  _serverId: string;
  _broker: SocketBroker;
  _errorHandler: Error => void;

  _channelsConnected: Map<ChannelUid, Set<ConnectionId>>;
  _connectionsStore: Map<
    ConnectionId,
    { connection: Connection, socket: Socket, channels: Set<ChannelUid> }
  >;

  constructor(
    serverId: string,
    broker: SocketBroker,
    handleError: Error => void
  ) {
    this._serverId = serverId;
    this._broker = broker;
    this._channelsConnected = new Map();
    this._connectionsStore = new Map();
    this._errorHandler = handleError;

    broker.onRemoteEvent(this._handleRemoteEvent);
  }

  addLocalConnection(socket: Socket, connection: Connection): boolean {
    const connectionId = connection.id;
    if (this._connectionsStore.has(connectionId)) {
      return false;
    }

    this._connectionsStore.set(connectionId, {
      socket,
      connection,
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
    scope: TopicScope
  ): Promise<boolean> {
    if (this._serverId !== connection.serverId) {
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
    scope: TopicScope
  ): Promise<boolean> {
    if (this._serverId !== connection.serverId) {
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

  async broadcast(
    channel: WebSocketChannel,
    order: EventOrder
  ): Promise<null | Connection[]> {
    if (channel.platform === WEBSOCKET && channel.type === 'connection') {
      const { connection } = channel;

      if (connection.serverId !== this._serverId) {
        return this._broker.broadcastRemote(
          { type: 'connection', connection },
          order
        );
      }

      const sentToLocal = await this._sendToLocalConnection(
        connection.id,
        order
      );

      if (!sentToLocal) {
        return this._broker.broadcastRemote(
          { type: 'connection', connection },
          order
        );
      }
      return [connection];
    }

    if (channel.platform === WEBSOCKET && channel.type === 'user') {
      throw new Error('sending to user scope is not yet implemented');
    }

    const [localResults, remoteResults] = await Promise.all([
      this._broadcastLocal(channel.uid, order),
      this._broker.broadcastRemote({ type: 'topic', uid: channel.uid }, order),
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
    await socket.disconnect({ connectionId: connId, reason });

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

  async _sendToLocalConnection(connectionId: ConnectionId, order: EventOrder) {
    const connStatus = this._connectionsStore.get(connectionId);
    if (connStatus === undefined) {
      return false;
    }

    const { socket } = connStatus;
    const { type, subtype, payload } = order;

    await socket.event({
      connectionId,
      type,
      subtype,
      payload,
    });

    return true;
  }

  async _broadcastLocal(
    chanUid: ChannelUid,
    order: EventOrder
  ): Promise<null | Connection[]> {
    const conneted = this._channelsConnected.get(chanUid);
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
            .event({ connectionId: connId, type, subtype, payload })
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
      this._sendToLocalConnection(target.connection.id, order).catch(
        this._errorHandler
      );
    } else if (target.type === 'topic') {
      this._broadcastLocal(target.uid, order).catch(this._errorHandler);
    } else {
      throw new Error(`unknown target received ${target.type}`);
    }
  }
}

export default Distributor;
