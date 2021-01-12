import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';
import { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { Server as WSServer } from 'ws';
import uniqid from 'uniqid';
import { makeClassProvider } from '@machinat/core/service';
import type { MachinatUser } from '@machinat/core/types';

import {
  BrokerI,
  SERVER_ID_I,
  WS_SERVER_I,
  LOGIN_VERIFIER_I,
  UPGRADE_VERIFIER_I,
  PLATFORM_CONFIGS_I,
} from './interface';
import Socket, {
  EventsBody,
  LoginBody,
  ConnectBody,
  DisconnectBody,
} from './socket';
import rejectUpgrade from './utils/rejectUpgrade';
import createWsSocket from './utils/createWsSocket';
import type {
  VerifyUpgradeFn,
  VerifyLoginFn,
  UpgradeRequestInfo,
  WebSocketJob,
  EventInput,
  ConnIdentifier,
} from './types';

type ConnectionData<User extends null | MachinatUser, Auth> = {
  connId: string;
  isConnected: boolean;
  user: User;
  socket: Socket;
  topics: Set<string>;
  auth: Auth;
  expireAt: null | Date;
};

type IntervalID = ReturnType<typeof setInterval>;

type SocketState = {
  socket: Socket;
  lostHeartbeat: number;
};

const Emitter = EventEmitter as { new <T>(): TypedEmitter<T> };

type ServerEvents<User extends null | MachinatUser, Auth> = {
  connect: (ctx: ConnectionData<User, Auth>) => void;
  events: (events: EventInput[], ctx: ConnectionData<User, Auth>) => void;
  disconnect: (
    reason: { reason?: string },
    ctx: ConnectionData<User, Auth>
  ) => void;
  error: (err: Error) => void;
};

/**
 * @category Provider
 */
export class WebSocketServer<
  User extends null | MachinatUser,
  Auth
> extends Emitter<ServerEvents<User, Auth>> {
  id: string;
  // @ts-expect-error: implement heart beat
  private _heartbeatIntervalId: IntervalID;

  private _wsServer: WSServer;
  private _broker: BrokerI;

  private _verifyLogin: VerifyLoginFn<User, Auth, unknown>;
  private _verifyUpgrade: VerifyUpgradeFn;

  private _socketStates: Map<string, SocketState>;
  private _connectionStates: Map<string, ConnectionData<User, Auth>>;

  private _topicMapping: Map<string, Set<string>>;
  private _userMapping: Map<string, Set<string>>;

  constructor(
    id: string | undefined,
    wsServer: WSServer,
    broker: BrokerI,
    verifyUpgrade: VerifyUpgradeFn,
    verifyLogin: VerifyLoginFn<User, Auth, unknown>,
    heartbeatInterval?: number
  ) {
    super();

    this.id = id || uniqid();
    this._wsServer = wsServer;
    this._broker = broker;

    this._socketStates = new Map();
    this._connectionStates = new Map();

    this._verifyLogin = verifyLogin;
    this._verifyUpgrade = verifyUpgrade;

    this._heartbeatIntervalId = setInterval(
      this._heartbeat.bind(this),
      heartbeatInterval
      // @ts-expect-error migrate building from babel to tsc
    ).unref();

    broker.onRemoteEvent(this._handleRemoteEventCallback);
  }

  async start(): Promise<void> {
    await this._broker.start();
  }

  async stop(): Promise<void> {
    await this._broker.stop();
  }

  async handleUpgrade(
    req: IncomingMessage,
    ns: NetSocket,
    head: Buffer
  ): Promise<void> {
    const requestInfo: UpgradeRequestInfo = {
      method: req.method as string,
      url: req.url as string,
      headers: req.headers,
    };

    const allowed = await this._verifyUpgrade(requestInfo);
    if (!allowed) {
      rejectUpgrade(ns, 400);
      return;
    }

    const ws = await createWsSocket(this._wsServer, req, ns, head);
    const socket = new Socket(uniqid(), ws, requestInfo);

    this._socketStates.set(socket.id, { socket, lostHeartbeat: 0 });

    socket.on('events', this._handleEventsCallback);
    socket.on('login', this._handleLoginCallback);
    socket.on('connect', this._handleConnectCallback);
    socket.on('connect_fail', this._handleConnectFailCallback);
    socket.on('disconnect', this._handleDisconnectCallback);
    socket.on('close', this._handleCloseCallback);
    socket.on('error', this._handleErrorCallback);
  }

  async subscribeTopic(conn: ConnIdentifier, topic: string): Promise<boolean> {
    if (this.id !== conn.serverId) {
      return this._broker.subscribeTopicRemote(conn, topic);
    }

    const connState = this._connectionStates.get(conn.id);
    if (connState === undefined) {
      return false;
    }

    connState.topics.add(topic);

    let connected = this._topicMapping.get(topic);
    if (connected === undefined) {
      connected = new Set();
      this._topicMapping.set(topic, connected);
    }

    connected.add(conn.id);
    return true;
  }

  async unsubscribeTopic(
    conn: ConnIdentifier,
    topic: string
  ): Promise<boolean> {
    if (this.id !== conn.serverId) {
      return this._broker.unsubscribeTopicRemote(conn, topic);
    }

    const connState = this._connectionStates.get(conn.id);
    if (connState === undefined) {
      return false;
    }

    const connsOfTopic = this._topicMapping.get(topic);
    if (connsOfTopic === undefined) {
      return true;
    }

    connsOfTopic.delete(conn.id);
    if (connsOfTopic.size === 0) {
      this._topicMapping.delete(topic);
    }

    return true;
  }

  async dispatch(job: WebSocketJob): Promise<null | ConnIdentifier[]> {
    const { target, events } = job;

    if (target.type === 'connection') {
      const { serverId, connectionId } = target;
      if (serverId !== this.id) {
        return this._broker.dispatchRemote(job);
      }

      const connection = this._connectionStates.get(connectionId);
      if (!connection) {
        return null;
      }

      return this._sendLocal([connection], events);
    }

    const remotePromise = this._broker.dispatchRemote(job);

    let localPromise: Promise<ConnIdentifier[] | null> | null;
    if (target.type === 'user') {
      const connections = this._getLocalConnsOfUser(target.userUId);

      localPromise = connections ? this._sendLocal(connections, events) : null;
    } else if (target.type === 'topic') {
      const connections = this._getLocalConnsOfTopic(target.name);

      localPromise = connections ? this._sendLocal(connections, events) : null;
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

  async disconnect(conn: ConnIdentifier, reason?: string): Promise<boolean> {
    if (conn.serverId !== this.id) {
      return this._broker.disconnectRemote(conn);
    }

    const connectionState = this._connectionStates.get(conn.id);
    if (!connectionState) {
      return false;
    }

    const { socket, user, topics } = connectionState;

    this._deleteTopicMapping(conn.id, topics);
    if (user) {
      this._deleteUserMapping(conn.id, user as MachinatUser);
    }

    this._connectionStates.delete(conn.id);
    await socket.disconnect({ connId: conn.id, reason });

    return true;
  }

  private _deleteTopicMapping(connId: string, topics: Set<string>): number {
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

  private _deleteUserMapping(connId: string, user: MachinatUser): boolean {
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

  private async _sendLocal(
    connections: ConnectionData<User, Auth>[],
    values: EventInput[]
  ): Promise<null | ConnIdentifier[]> {
    const promises: Promise<number | null>[] = [];
    const sentChannels: ConnIdentifier[] = [];

    for (const { connId, socket } of connections) {
      promises.push(
        socket.dispatch({ connId, values }).catch((err) => {
          this._handleError(err);
          return null;
        })
      );

      sentChannels.push({ serverId: this.id, id: connId });
    }

    const results = await Promise.all(promises);
    const finishedConns = sentChannels.filter((_, i) => results[i] !== null);

    return finishedConns.length > 0 ? finishedConns : null;
  }

  private _getLocalConnsOfUser(uid: string) {
    const connsOfUser = this._userMapping.get(uid);
    if (!connsOfUser) {
      return null;
    }

    const connections: ConnectionData<User, Auth>[] = [];
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

  private _getLocalConnsOfTopic(topic: string) {
    const connsOfTopic = this._topicMapping.get(topic);
    if (!connsOfTopic) {
      return null;
    }

    const connections: ConnectionData<User, Auth>[] = [];
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
  private _handleRemoteEvent({ target, events }: WebSocketJob) {
    if (target.type === 'connection') {
      if (target.serverId === this.id) {
        const connection = this._connectionStates.get(target.connectionId);
        if (!connection) {
          return;
        }

        this._sendLocal([connection], events).catch(this._handleErrorCallback);
      }
    } else if (target.type === 'topic') {
      const connsOfTopic = this._getLocalConnsOfTopic(target.name);
      if (!connsOfTopic) {
        return;
      }

      this._sendLocal(connsOfTopic, events).catch(this._handleErrorCallback);
    } else if (target.type === 'user') {
      const connsOfUser = this._getLocalConnsOfUser(target.userUId);
      if (!connsOfUser) {
        return;
      }

      this._sendLocal(connsOfUser, events).catch(this._handleErrorCallback);
    } else {
      throw new Error(
        `unknown target received ${(target as any).type || String(target)}`
      );
    }
  }

  private _handleLoginCallback = (body, seq, socket) => {
    this._handleLogin(body, seq, socket).catch(this._handleErrorCallback);
  };

  private async _handleLogin(body: LoginBody, seq: number, socket: Socket) {
    const connId: string = uniqid();

    try {
      const authResult = await this._verifyLogin(
        socket.request,
        body.credential
      );

      if (authResult.success) {
        const { authContext, user, expireAt } = authResult;

        this._connectionStates.set(connId, {
          connId,
          isConnected: false,
          socket,
          user,
          auth: authContext,
          expireAt: expireAt || null,
          topics: new Set(),
        });

        await socket.connect({ connId, seq });
      } else {
        await socket.reject({ seq, reason: authResult.reason });
      }
    } catch (err) {
      await socket.reject({ seq, reason: err.message });
    }
  }

  private _handleConnectCallback = (body, seq, socket) => {
    this._handleConnect(body, seq, socket).catch(this._handleErrorCallback);
  };

  private async _handleConnect(body: ConnectBody, seq: number, socket: Socket) {
    const { connId } = body;
    const connState = this._connectionStates.get(connId);

    if (connState === undefined) {
      // reject if not signed in
      await socket.disconnect({
        connId,
        reason: 'connection is not signed in',
      });
    } else {
      connState.isConnected = true;

      const { user } = connState;
      if (user) {
        const connsOfUser = this._userMapping.get(user.uid);
        if (connsOfUser) {
          connsOfUser.add(connId);
        } else {
          this._userMapping.set(user.uid, new Set([connId]));
        }
      }

      this.emit('connect', connState);
    }
  }

  private _handleConnectFailCallback = this._handleConnectFail.bind(this);
  private _handleConnectFail({ connId }: DisconnectBody) {
    this._connectionStates.delete(connId);
  }

  private _handleEventsCallback = (body, seq, socket) => {
    this._handleEvents(body, seq, socket).catch(this._handleErrorCallback);
  };

  private async _handleEvents(body: EventsBody, seq: number, socket: Socket) {
    const { connId, values } = body;
    const connState = this._connectionStates.get(connId);

    if (connState === undefined) {
      // reject if not signed in
      await socket.disconnect({
        connId,
        reason: 'connection is not logged in',
      });
    } else {
      this.emit('events', values, connState);
    }
  }

  private _handleDisconnectCallback = this._handleDisconnect.bind(this);
  private _handleDisconnect({ connId, reason }: DisconnectBody) {
    const connState = this._connectionStates.get(connId);

    if (connState !== undefined) {
      const { topics, user } = connState;
      this._deleteTopicMapping(connId, topics);

      if (user) {
        this._deleteUserMapping(connId, user as MachinatUser);
      }

      this._connectionStates.delete(connId);
      this.emit('disconnect', { reason }, connState);
    }
  }

  private _handleCloseCallback = this._handleClose.bind(this);
  private _handleClose(code: number, reason: string, socket: Socket) {
    socket.removeAllListeners();
    this._socketStates.delete(socket.id);
  }

  private _handleErrorCallback = this._handleError.bind(this);
  private _handleError(err: Error) {
    this.emit('error', err);
  }

  private _heartbeat() {
    for (const [_, { socket }] of this._socketStates) {
      // TODO: remove unresponding sockets
      socket.ping();
    }
  }
}

export const ServerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    { require: SERVER_ID_I, optional: true },
    WS_SERVER_I,
    BrokerI,
    { require: UPGRADE_VERIFIER_I, optional: true },
    { require: LOGIN_VERIFIER_I, optional: true },
    PLATFORM_CONFIGS_I,
  ] as const,
  factory: (
    serverId,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin,
    { heartbeatInterval }
  ) =>
    new WebSocketServer(
      serverId || undefined,
      wsServer,
      broker,
      verifyUpgrade || (() => true),
      verifyLogin ||
        (async () => ({ success: true, user: null, authContext: null })),
      heartbeatInterval
    ),
})(WebSocketServer);

export type ServerP<User extends null | MachinatUser, Auth> = WebSocketServer<
  User,
  Auth
>;
