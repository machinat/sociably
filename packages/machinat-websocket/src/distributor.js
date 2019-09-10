// @flow
import type {
  EventOrder,
  Connection,
  ConnectionId,
  ChannelUid,
  SocketId,
  SocketBroker,
  RemoteTarget,
} from './types';
import { WebSocketChannel } from './channel';

class Distributor {
  _broker: SocketBroker;
  _errorHandler: Error => void;

  _channelsConnected: Map<ChannelUid, Set<ConnectionId>>;
  _connectionsStore: Map<
    ConnectionId,
    { connection: Connection, channels: Set<ChannelUid> }
  >;

  constructor(broker: SocketBroker, handleError: Error => void) {
    this._broker = broker;
    this._channelsConnected = new Map();
    this._connectionsStore = new Map();
    this._errorHandler = handleError;

    broker.onRemoteEvent(this._handleRemoteEvent);
  }

  addLocalConnection(connection: Connection): boolean {
    const connectionId = connection.id;
    if (this._connectionsStore.has(connectionId)) {
      return false;
    }

    this._connectionsStore.set(connectionId, {
      connection,
      channels: new Set(),
    });
    return true;
  }

  removeLocalConnection(connId: ConnectionId): boolean {
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

  async attachToTopic(
    channel: WebSocketChannel,
    connId: ConnectionId
  ): Promise<boolean> {
    const connStatus = this._connectionsStore.get(connId);
    if (connStatus === undefined) {
      const remoteResult = await this._broker.attachRemoteConnectionToTopic(
        channel,
        connId
      );

      return remoteResult;
    }

    let connected = this._channelsConnected.get(channel.uid);
    if (connected === undefined) {
      connected = new Set();
    } else if (connected.has(connId)) {
      return false;
    }

    connected.add(connId);
    return true;
  }

  async detachFromTopic(
    channel: WebSocketChannel,
    conneId: ConnectionId
  ): Promise<boolean> {
    const connStatus = this._connectionsStore.get(conneId);
    if (connStatus === undefined) {
      const remoteResult = await this._broker.detachRemoteConnectionFromTopic(
        channel,
        conneId
      );
      return remoteResult;
    }

    const connected = this._channelsConnected.get(channel.uid);
    if (connected === undefined || !connected.delete(conneId)) {
      return false;
    }

    if (connected.size === 0) {
      this._channelsConnected.delete(channel.uid);
    }

    return true;
  }

  async broadcast(
    channel: WebSocketChannel,
    order: EventOrder
  ): Promise<null | SocketId[]> {
    if (channel.type === '@socket') {
      throw new Error();
    }

    if (channel.type === '@connection') {
      const connectionId: ConnectionId = (channel.id: any);
      const sentToLocal = await this._sendToLocalConnection(
        connectionId,
        order
      );

      if (!sentToLocal) {
        return this._broker.broadcastRemote(
          { type: 'connection', connectionId },
          order
        );
      }

      return [connectionId];
    }

    const [localResults, remoteResults] = await Promise.all([
      this._broadcastLocal(channel.uid, order),
      this._broker.broadcastRemote(
        { type: 'topic', channelUid: channel.uid },
        order
      ),
    ]);

    return localResults === null
      ? remoteResults
      : remoteResults === null
      ? localResults
      : [...localResults, ...remoteResults];
  }

  async disconnect(connId: ConnectionId, reason: string) {
    const connStatus = this._connectionsStore.get(connId);
    if (connStatus === undefined) {
      return false;
    }

    const {
      connection: { socket },
      channels,
    } = connStatus;

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

    const { socket } = connStatus.connection;
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
  ): Promise<null | ConnectionId[]> {
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

    const whitelistSet = whitelist && new Set(whitelist);
    const blacklistSet = blacklist && new Set(blacklist);

    const promises = [];
    const sentConns = [];
    for (const connId of conneted) {
      // send event and collect promises and ids
      const connStatus = this._connectionsStore.get(connId);

      if (connStatus === undefined) {
        conneted.delete(connId);
      } else if (
        (!whitelistSet || whitelistSet.has(connId)) &&
        (!blacklistSet || !blacklistSet.has(connId))
      ) {
        const { socket } = connStatus.connection;
        promises.push(
          socket
            .event({ connectionId: connId, type, subtype, payload })
            .catch(this._errorHandler)
        );
        sentConns.push(connId);
      }
    }

    const results = await Promise.all(promises);
    const connsFinished: ConnectionId[] = [];

    for (let i = 0; i < results.length; i += 1) {
      const connId = sentConns[i];

      if (results[i] === undefined) {
        // remove errored connection
        conneted.delete(connId);
        this._connectionsStore.delete(connId);
      } else {
        connsFinished.push(connId);
      }
    }

    return connsFinished;
  }

  _handleRemoteEvent(target: RemoteTarget, order: EventOrder) {
    if (target.type === 'connection') {
      this._sendToLocalConnection(target.connectionId, order).catch(
        this._errorHandler
      );
    } else if (target.type === 'topic') {
      this._broadcastLocal(target.channelUid, order).catch(this._errorHandler);
    } else {
      throw new Error(`unknown target received ${target.type}`);
    }
  }
}

export default Distributor;
