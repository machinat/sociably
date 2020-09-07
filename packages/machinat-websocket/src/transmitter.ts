import { provider } from '@machinat/core/service';
import { MachinatUser } from '@machinat/core/types';
import { BrokerI, SERVER_ID_I, PLATFORM_MOUNTER_I } from './interface';
import { EventInput, WebSocketJob, WebSocketPlatformMounter } from './types';
import Socket from './socket';
import { ConnectionChannel, TopicChannel } from './channel';

type ConnectionState = {
  channel: ConnectionChannel;
  user: null | MachinatUser;
  socket: Socket;
  attachedTopics: Set<string>;
};

/** @internal */
const findConnection = (
  { serverId, connectionId }: ConnectionChannel,
  list: ConnectionChannel[]
) =>
  list.find((c) => c.serverId === serverId && c.connectionId === connectionId);

/**
 * @category Provider
 */
export class WebSocketTransmitter {
  serverId: string;
  private _broker: BrokerI;

  private _topicMapping: Map<string, Set<string>>;
  private _userMapping: Map<string, Set<string>>;
  private _connectionStates: Map<string, ConnectionState>;

  private _errorHandler: (err: Error) => void;

  constructor(
    serverId: string,
    broker: BrokerI,
    errorHandler: (err: Error) => void
  ) {
    this.serverId = serverId;
    this._broker = broker;
    this._topicMapping = new Map();
    this._userMapping = new Map();
    this._connectionStates = new Map();
    this._errorHandler = errorHandler;

    broker.onRemoteEvent(this._handleRemoteEventCallback);
  }

  async start(): Promise<void> {
    await this._broker.start();
  }

  async stop(): Promise<void> {
    await this._broker.stop();
  }

  addLocalConnection(
    channel: ConnectionChannel,
    socket: Socket,
    user: null | MachinatUser
  ): boolean {
    const connId = channel.id;
    if (this._connectionStates.has(connId)) {
      return false;
    }

    this._connectionStates.set(connId, {
      socket,
      channel,
      user,
      attachedTopics: new Set(),
    });

    if (user) {
      const connsOfUser = this._userMapping.get(user.uid);
      if (connsOfUser) {
        connsOfUser.add(connId);
      } else {
        this._userMapping.set(user.uid, new Set([connId]));
      }
    }

    return true;
  }

  removeLocalConnection({ id: connId }: ConnectionChannel): boolean {
    const connectionState = this._connectionStates.get(connId);
    if (connectionState === undefined) {
      return false;
    }

    const { attachedTopics, user } = connectionState;
    this._deleteFromTopicMapping(connId, attachedTopics);

    if (user) {
      this._deleteFromUserMapping(connId, user);
    }

    this._connectionStates.delete(connId);
    return true;
  }

  async subscribeTopic(
    conn: ConnectionChannel,
    topic: string | TopicChannel
  ): Promise<boolean> {
    const topicName = typeof topic === 'string' ? topic : topic.name;

    if (this.serverId !== conn.serverId) {
      return this._broker.subscribeTopicRemote(conn, topicName);
    }

    const connState = this._connectionStates.get(conn.id);
    if (connState === undefined) {
      return false;
    }

    connState.attachedTopics.add(topicName);

    let connected = this._topicMapping.get(topicName);
    if (connected === undefined) {
      connected = new Set();
      this._topicMapping.set(topicName, connected);
    }

    connected.add(conn.id);
    return true;
  }

  async unsubscribeTopic(
    conn: ConnectionChannel,
    topic: string | TopicChannel
  ): Promise<boolean> {
    const topicName = typeof topic === 'string' ? topic : topic.name;

    if (this.serverId !== conn.serverId) {
      return this._broker.unsubscribeTopicRemote(conn, topicName);
    }

    const connState = this._connectionStates.get(conn.id);
    if (connState === undefined) {
      return false;
    }

    const connsOfTopic = this._topicMapping.get(topicName);
    if (connsOfTopic === undefined) {
      return true;
    }

    connsOfTopic.delete(conn.id);
    if (connsOfTopic.size === 0) {
      this._topicMapping.delete(topicName);
    }

    return true;
  }

  async dispatch(job: WebSocketJob): Promise<null | ConnectionChannel[]> {
    const { target, events, whitelist, blacklist } = job;

    if (target.type === 'connection') {
      const { serverId, connectionId } = target;
      if (serverId !== this.serverId) {
        return this._broker.dispatchRemote(job);
      }

      const connection = this._connectionStates.get(connectionId);
      if (!connection) {
        return null;
      }

      return this._sendLocalConnections([connection], events, null, null);
    }

    const remotePromise = this._broker.dispatchRemote(job);

    let localPromise: Promise<ConnectionChannel[] | null> | null;
    if (target.type === 'user') {
      const connections = this._getLocalConnectionsOfUser(target.userUId);

      localPromise = connections
        ? this._sendLocalConnections(connections, events, whitelist, blacklist)
        : null;
    } else if (target.type === 'topic') {
      const connections = this._getLocalConnectionsOfTopic(target.name);

      localPromise = connections
        ? this._sendLocalConnections(connections, events, whitelist, blacklist)
        : null;
    } else {
      throw new TypeError(`unknown target received ${JSON.stringify(target)}`);
    }

    const [localResults, remoteResults] = await Promise.all([
      localPromise,
      remotePromise,
    ]);

    return localResults === null
      ? remoteResults
      : remoteResults === null
      ? localResults
      : [...localResults, ...remoteResults];
  }

  async disconnect(conn: ConnectionChannel, reason?: string): Promise<boolean> {
    const { serverId, connectionId } = conn;
    if (serverId !== this.serverId) {
      return this._broker.disconnectRemote(conn);
    }

    const connectionState = this._connectionStates.get(connectionId);
    if (!connectionState) {
      return false;
    }

    const { socket, user, attachedTopics } = connectionState;

    this._deleteFromTopicMapping(connectionId, attachedTopics);
    if (user) {
      this._deleteFromUserMapping(connectionId, user);
    }

    this._connectionStates.delete(connectionId);
    await socket.disconnect({ connId: connectionId, reason });

    return true;
  }

  private _deleteFromTopicMapping(connId: string, topics: Set<string>): number {
    let count = 0;
    for (const topicName of topics) {
      const connsOfTopic = this._topicMapping.get(topicName);

      if (connsOfTopic !== undefined && connsOfTopic.delete(connId)) {
        count += 1;

        if (connsOfTopic.size === 0) {
          this._topicMapping.delete(topicName);
        }
      }
    }
    return count;
  }

  private _deleteFromUserMapping(connId: string, user: MachinatUser): boolean {
    const connsOfUser = this._userMapping.get(user.uid);
    if (connsOfUser) {
      const isDeleted = connsOfUser.delete(connId);

      if (connsOfUser.size === 0) {
        this._userMapping.delete(user.uid);
      }
      return isDeleted;
    }
    return false;
  }

  private async _sendLocalConnections(
    connections: ConnectionState[],
    events: EventInput[],
    whitelist: null | ConnectionChannel[],
    blacklist: null | ConnectionChannel[]
  ): Promise<null | ConnectionChannel[]> {
    const promises: Promise<number | null>[] = [];
    const sentChannels: ConnectionChannel[] = [];

    for (const { channel, socket } of connections) {
      if (
        (!whitelist || findConnection(channel, whitelist)) &&
        (!blacklist || !findConnection(channel, blacklist))
      ) {
        promises.push(
          socket.dispatch({ connId: channel.id, events }).catch((err) => {
            this._errorHandler(err);
            return null;
          })
        );

        sentChannels.push(channel);
      }
    }

    const results = await Promise.all(promises);
    const channelsFinished = sentChannels.filter((_, i) => results[i] !== null);

    return channelsFinished.length > 0 ? channelsFinished : null;
  }

  private _getLocalConnectionsOfUser(uid: string) {
    const connsOfUser = this._userMapping.get(uid);
    if (!connsOfUser) {
      return null;
    }

    const connections: ConnectionState[] = [];
    for (const connId of connsOfUser) {
      const connection = this._connectionStates.get(connId);

      if (connection) {
        connections.push(connection);
      } else {
        connsOfUser.delete(connId);
        if (connsOfUser.size === 0) {
          this._userMapping.delete(uid);
        }
      }
    }

    return connections.length === 0 ? null : connections;
  }

  private _getLocalConnectionsOfTopic(topic: string) {
    const connsOfTopic = this._topicMapping.get(topic);
    if (!connsOfTopic) {
      return null;
    }

    const connections: ConnectionState[] = [];
    for (const connId of connsOfTopic) {
      const connection = this._connectionStates.get(connId);

      if (connection) {
        connections.push(connection);
      } else {
        connsOfTopic.delete(connId);
        if (connsOfTopic.size === 0) {
          this._topicMapping.delete(topic);
        }
      }
    }

    return connections.length === 0 ? null : connections;
  }

  private _handleRemoteEventCallback = this._handleRemoteEvent.bind(this);

  private _handleRemoteEvent({
    target,
    events,
    whitelist,
    blacklist,
  }: WebSocketJob) {
    if (target.type === 'connection') {
      if (target.serverId === this.serverId) {
        const connection = this._connectionStates.get(target.connectionId);
        if (!connection) {
          return;
        }

        this._sendLocalConnections([connection], events, null, null).catch(
          this._errorHandler
        );
      }
    } else if (target.type === 'topic') {
      const connsOfTopic = this._getLocalConnectionsOfTopic(target.name);
      if (!connsOfTopic) {
        return;
      }

      this._sendLocalConnections(
        connsOfTopic,
        events,
        whitelist,
        blacklist
      ).catch(this._errorHandler);
    } else if (target.type === 'user') {
      const connsOfUser = this._getLocalConnectionsOfUser(target.userUId);
      if (!connsOfUser) {
        return;
      }

      this._sendLocalConnections(
        connsOfUser,
        events,
        whitelist,
        blacklist
      ).catch(this._errorHandler);
    } else {
      throw new Error(
        `unknown target received ${(target as any).type || String(target)}`
      );
    }
  }
}

export const TransmitterP = provider<WebSocketTransmitter>({
  lifetime: 'singleton',
  deps: [SERVER_ID_I, BrokerI, PLATFORM_MOUNTER_I],
  factory: (
    serverId: string,
    broker: BrokerI,
    { initScope, popError }: WebSocketPlatformMounter<any>
  ) =>
    new WebSocketTransmitter(serverId, broker, (err) =>
      popError(err, initScope())
    ),
})(WebSocketTransmitter);

export type TransmitterP = WebSocketTransmitter;
