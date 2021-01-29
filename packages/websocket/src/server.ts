import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';
import { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { Server as WsServer } from 'ws';
import uniqid from 'uniqid';
import { HttpRequestInfo } from '@machinat/http/types';
import { makeClassProvider } from '@machinat/core/service';
import type { MachinatUser } from '@machinat/core/types';

import {
  BrokerI,
  ServerIdI,
  WsServerI,
  LoginVerifierI,
  UpgradeVerifierI,
  ConfigsI,
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

type ConnectionInfo<User extends null | MachinatUser, Auth> = {
  connId: string;
  user: User;
  request: HttpRequestInfo;
  authContext: Auth;
  expireAt: null | Date;
};

type ConnectionState<User extends null | MachinatUser, Auth> = {
  isConnected: boolean;
  socket: Socket;
  topics: Set<string>;
  info: ConnectionInfo<User, Auth>;
};

type IntervalID = ReturnType<typeof setInterval>;

type SocketState = {
  socket: Socket;
  lostHeartbeat: number;
};

const Emitter = EventEmitter as { new <T>(): TypedEmitter<T> };

type ServerEvents<User extends null | MachinatUser, Auth> = {
  connect: (info: ConnectionInfo<User, Auth>) => void;
  events: (events: EventInput[], info: ConnectionInfo<User, Auth>) => void;
  disconnect: (
    reason: { reason?: string },
    info: ConnectionInfo<User, Auth>
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

  private _wsServer: WsServer;
  private _broker: BrokerI;

  private _verifyLogin: VerifyLoginFn<User, Auth, unknown>;
  private _verifyUpgrade: VerifyUpgradeFn;

  private _socketStates: Map<string, SocketState>;
  private _connectionStates: Map<string, ConnectionState<User, Auth>>;

  private _topicMapping: Map<string, Set<string>>;
  private _userMapping: Map<string, Set<string>>;

  constructor(
    id: string | undefined,
    wsServer: WsServer,
    broker: BrokerI,
    verifyUpgrade: VerifyUpgradeFn,
    verifyLogin: VerifyLoginFn<User, Auth, unknown>,
    { heartbeatInterval }: { heartbeatInterval?: number } = {}
  ) {
    super();

    this.id = id || uniqid();
    this._wsServer = wsServer;
    this._broker = broker;

    this._socketStates = new Map();
    this._connectionStates = new Map();

    this._topicMapping = new Map();
    this._userMapping = new Map();

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

  async dispatch(job: WebSocketJob): Promise<ConnIdentifier[]> {
    const { target, values } = job;

    if (target.type === 'connection') {
      const { serverId, id: connId } = target;

      if (serverId !== this.id) {
        return this._broker.dispatchRemote(job);
      }

      const connection = this._connectionStates.get(connId);
      if (!connection) {
        return [];
      }

      return this._sendLocal([connection], values);
    }

    const remotePromise = this._broker.dispatchRemote(job);
    let localPromise: Promise<ConnIdentifier[]> | [];

    if (target.type === 'user') {
      const connections = this._getLocalConnsOfUser(target.userUid);

      localPromise = connections
        ? this._sendLocal(connections, values)
        : Promise.resolve([]);
    } else if (target.type === 'topic') {
      const connections = this._getLocalConnsOfTopic(target.name);

      localPromise = connections ? this._sendLocal(connections, values) : [];
    } else {
      throw new TypeError(`unknown target received ${JSON.stringify(target)}`);
    }

    const [localResults, remoteResults] = await Promise.all([
      localPromise,
      remotePromise,
    ]);

    return [...localResults, ...remoteResults];
  }

  async disconnect(conn: ConnIdentifier, reason?: string): Promise<boolean> {
    if (conn.serverId !== this.id) {
      return this._broker.disconnectRemote(conn);
    }

    const connectionState = this._connectionStates.get(conn.id);
    if (!connectionState) {
      return false;
    }

    const {
      info: { user },
      socket,
      topics,
    } = connectionState;

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
    connStates: ConnectionState<User, Auth>[],
    values: EventInput[]
  ): Promise<ConnIdentifier[]> {
    const promises: Promise<number | null>[] = [];
    const sentChannels: ConnIdentifier[] = [];

    for (const {
      socket,
      info: { connId },
    } of connStates) {
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

    return finishedConns;
  }

  private _getLocalConnsOfUser(uid: string) {
    const connsOfUser = this._userMapping.get(uid);
    if (!connsOfUser) {
      return null;
    }

    const connStates: ConnectionState<User, Auth>[] = [];
    for (const connId of connsOfUser) {
      const state = this._connectionStates.get(connId);

      if (state) {
        connStates.push(state);
      } else {
        connsOfUser.delete(connId);

        if (connsOfUser.size === 0) {
          this._userMapping.delete(uid);
        }
      }
    }

    return connStates.length === 0 ? null : connStates;
  }

  private _getLocalConnsOfTopic(topic: string) {
    const subsrcibingConns = this._topicMapping.get(topic);
    if (!subsrcibingConns) {
      return null;
    }

    const connStates: ConnectionState<User, Auth>[] = [];
    for (const connId of subsrcibingConns) {
      const connection = this._connectionStates.get(connId);

      if (connection) {
        connStates.push(connection);
      } else {
        subsrcibingConns.delete(connId);

        if (subsrcibingConns.size === 0) {
          this._topicMapping.delete(topic);
        }
      }
    }

    return connStates.length === 0 ? null : connStates;
  }

  private _handleRemoteEventCallback = this._handleRemoteEvent.bind(this);
  private _handleRemoteEvent({ target, values }: WebSocketJob) {
    if (target.type === 'connection') {
      if (target.serverId === this.id) {
        const connState = this._connectionStates.get(target.id);
        if (!connState) {
          return;
        }

        this._sendLocal([connState], values).catch(this._handleErrorCallback);
      }
    } else if (target.type === 'topic') {
      const subsrcibingConns = this._getLocalConnsOfTopic(target.name);
      if (!subsrcibingConns) {
        return;
      }

      this._sendLocal(subsrcibingConns, values).catch(
        this._handleErrorCallback
      );
    } else if (target.type === 'user') {
      const connsOfUser = this._getLocalConnsOfUser(target.userUid);
      if (!connsOfUser) {
        return;
      }

      this._sendLocal(connsOfUser, values).catch(this._handleErrorCallback);
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
      const request = socket.request as HttpRequestInfo;
      const authResult = await this._verifyLogin(request, body.credential);

      if (authResult.success) {
        const { authContext, user, expireAt } = authResult;

        this._connectionStates.set(connId, {
          socket,
          isConnected: false,
          topics: new Set(),
          info: {
            connId,
            user,
            request,
            authContext,
            expireAt: expireAt || null,
          },
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

      const { user } = connState.info;
      if (user) {
        const connsOfUser = this._userMapping.get(user.uid);
        if (connsOfUser) {
          connsOfUser.add(connId);
        } else {
          this._userMapping.set(user.uid, new Set([connId]));
        }
      }

      this.emit('connect', connState.info);
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
      this.emit('events', values, connState.info);
    }
  }

  private _handleDisconnectCallback = this._handleDisconnect.bind(this);
  private _handleDisconnect({ connId, reason }: DisconnectBody) {
    const connState = this._connectionStates.get(connId);

    if (connState !== undefined) {
      const { topics, info } = connState;
      this._deleteTopicMapping(connId, topics);

      if (info.user) {
        this._deleteUserMapping(connId, info.user as MachinatUser);
      }

      this._connectionStates.delete(connId);
      this.emit('disconnect', { reason }, info);
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
    { require: ServerIdI, optional: true },
    WsServerI,
    BrokerI,
    { require: UpgradeVerifierI, optional: true },
    { require: LoginVerifierI, optional: true },
    ConfigsI,
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
      { heartbeatInterval }
    ),
})(WebSocketServer);

export type ServerP<User extends null | MachinatUser, Auth> = WebSocketServer<
  User,
  Auth
>;
