import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type TypedEmitter from 'typed-emitter';
import type { WebSocketServer as WsServer } from 'ws';
import uniqid from 'uniqid';
import type { SociablyUser } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import Marshaler from '@sociably/core/base/Marshaler';
import { HttpRequestInfo } from '@sociably/http';

import {
  BrokerI,
  ServerIdI,
  WsServerI,
  LoginVerifierI,
  UpgradeVerifierI,
  ConfigsI,
} from './interface.js';
import Socket, {
  EventsBody,
  LoginBody,
  ConnectBody,
  DisconnectBody,
} from './Socket.js';
import rejectUpgrade from './utils/rejectUpgrade.js';
import createWsSocket from './utils/createWsSocket.js';
import type {
  VerifyUpgradeFn,
  VerifyLoginFn,
  UpgradeRequestInfo,
  WebSocketJob,
  EventInput,
  ConnIdentifier,
  DispatchTarget,
} from './types.js';

const DEFAULT_HEARTBEAT_INTERVAL = 60000; // 1 min

type ConnectionInfo<User extends null | SociablyUser, Auth> = {
  connId: string;
  user: User;
  request: HttpRequestInfo;
  authContext: Auth;
  expireAt: null | Date;
};

type ConnectionState<User extends null | SociablyUser, Auth> = {
  isConnected: boolean;
  socket: Socket;
  topics: Set<string>;
  info: ConnectionInfo<User, Auth>;
};

type IntervalID = ReturnType<typeof setInterval>;

type SocketState = {
  lostHeartbeat: number;
};

const Emitter = EventEmitter as new <
  T extends TypedEmitter.EventMap,
>() => TypedEmitter.default<T>;

type ServerEvents<User extends null | SociablyUser, Auth> = {
  connect: (conn: ConnectionInfo<User, Auth>) => void;
  events: (events: EventInput[], conn: ConnectionInfo<User, Auth>) => void;
  disconnect: (
    reason: { reason?: string },
    conn: ConnectionInfo<User, Auth>
  ) => void;
  error: (err: Error) => void;
};

type ServerOptions<User extends null | SociablyUser, Auth> = {
  id: string | undefined;
  wsServer: WsServer;
  broker: BrokerI;
  marshaler: Marshaler;
  verifyUpgrade: VerifyUpgradeFn;
  verifyLogin: VerifyLoginFn<User, Auth, unknown>;
  heartbeatInterval?: number;
};

/**
 * @category Provider
 */
export class WebSocketServer<
  User extends null | SociablyUser,
  Auth,
> extends Emitter<ServerEvents<User, Auth>> {
  id: string;
  marshaler: Marshaler;
  // @ts-expect-error: implement heart beat
  private _heartbeatIntervalId: IntervalID;

  private _wsServer: WsServer;
  private _broker: BrokerI;

  private _verifyLogin: VerifyLoginFn<User, Auth, unknown>;
  private _verifyUpgrade: VerifyUpgradeFn;

  private _socketStates: Map<Socket, SocketState>;
  private _connectionStates: Map<string, ConnectionState<User, Auth>>;

  private _topicMapping: Map<string, Set<string>>;

  constructor({
    id,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin,
    heartbeatInterval,
    marshaler,
  }: ServerOptions<User, Auth>) {
    super();

    this.id = id || uniqid();
    this.marshaler = marshaler;
    this._wsServer = wsServer;
    this._broker = broker;

    this._socketStates = new Map();
    this._connectionStates = new Map();

    this._topicMapping = new Map();

    this._verifyLogin = verifyLogin;
    this._verifyUpgrade = verifyUpgrade;

    this._heartbeatIntervalId = setInterval(
      this._heartbeat.bind(this),
      heartbeatInterval || DEFAULT_HEARTBEAT_INTERVAL
    ).unref();

    broker.onRemoteEvent(this._handleRemoteEvent.bind(this));
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
      method: req.method!,
      url: req.url!,
      headers: req.headers,
    };

    const allowed = await this._verifyUpgrade(requestInfo);
    if (!allowed) {
      rejectUpgrade(ns, 400);
      return;
    }

    const ws = await createWsSocket(this._wsServer, req, ns, head);
    const socket = new Socket(ws, requestInfo);

    this._socketStates.set(socket, { lostHeartbeat: 0 });

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
        return this._dispatchRemote(target, values);
      }

      const connection = this._connectionStates.get(connId);
      if (!connection) {
        return [];
      }

      return this._dispatchLocal([connection], values);
    }

    const remotePromise = this._dispatchRemote(target, values);
    let localPromise: Promise<ConnIdentifier[]> | [];

    if (target.type === 'topic') {
      const connections = this._getLocalSubscriptionOfTopic(target.key);

      localPromise = connections
        ? this._dispatchLocal(connections, values)
        : [];

      const [localResults, remoteResults] = await Promise.all([
        localPromise,
        remotePromise,
      ]);

      return [...localResults, ...remoteResults];
    }

    throw new TypeError(`unknown target received ${JSON.stringify(target)}`);
  }

  async disconnect(conn: ConnIdentifier, reason?: string): Promise<boolean> {
    if (conn.serverId !== this.id) {
      return this._broker.disconnectRemote(conn);
    }

    const connectionState = this._connectionStates.get(conn.id);
    if (!connectionState) {
      return false;
    }

    const { socket, topics } = connectionState;
    this._deleteTopicMapping(conn.id, topics);

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

  private async _dispatchRemote(target: DispatchTarget, values: EventInput[]) {
    return this._broker.dispatchRemote({
      target,
      values: values.map(({ category, type, payload }) => ({
        category,
        type,
        payload: this.marshaler.marshal(payload),
      })),
    });
  }

  private async _dispatchLocal(
    connStates: ConnectionState<User, Auth>[],
    values: EventInput[]
  ): Promise<ConnIdentifier[]> {
    const promises: Promise<number | null>[] = [];
    const sentThreads: ConnIdentifier[] = [];

    for (const {
      socket,
      info: { connId },
    } of connStates) {
      promises.push(
        socket
          .dispatch({
            connId,
            values: values.map(({ category, type, payload }) => ({
              category,
              type,
              payload: this.marshaler.marshal(payload),
            })),
          })
          .catch((err) => {
            this._handleError(err);
            return null;
          })
      );

      sentThreads.push({ serverId: this.id, id: connId });
    }

    const results = await Promise.all(promises);
    const finishedConns = sentThreads.filter((_, i) => results[i] !== null);

    return finishedConns;
  }

  private _getLocalSubscriptionOfTopic(topic: string) {
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

  private _handleRemoteEvent({ target, values }: WebSocketJob) {
    if (target.type === 'connection') {
      if (target.serverId === this.id) {
        const connState = this._connectionStates.get(target.id);
        if (!connState) {
          return;
        }

        this._dispatchLocal([connState], values).catch(
          this._handleErrorCallback
        );
      }
    } else if (target.type === 'topic') {
      const subsrcibingConns = this._getLocalSubscriptionOfTopic(target.key);
      if (!subsrcibingConns) {
        return;
      }

      this._dispatchLocal(subsrcibingConns, values).catch(
        this._handleErrorCallback
      );
    } else {
      throw new Error(
        `unknown target received ${(target as any)?.type || String(target)}`
      );
    }
  }

  private _handleLoginCallback = (body, seq, socket) => {
    this._handleLogin(body, seq, socket).catch(this._handleErrorCallback);
  };

  private async _handleLogin(body: LoginBody, seq: number, socket: Socket) {
    const connId: string = uniqid.time();

    try {
      const request = socket.request as HttpRequestInfo;
      const authResult = await this._verifyLogin(request, body.credential);

      if (authResult.ok) {
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
      this.emit(
        'events',
        values.map(({ category, type, payload }) => ({
          category,
          type,
          payload: this.marshaler.unmarshal(payload),
        })),
        connState.info
      );
    }
  }

  private _handleDisconnectCallback = this._handleDisconnect.bind(this);
  private _handleDisconnect({ connId, reason }: DisconnectBody) {
    const connState = this._connectionStates.get(connId);

    if (connState !== undefined) {
      const { topics, info } = connState;
      this._deleteTopicMapping(connId, topics);

      this._connectionStates.delete(connId);
      this.emit('disconnect', { reason }, info);
    }
  }

  private _handleCloseCallback = this._handleClose.bind(this);
  private _handleClose(code: number, reason: string, socket: Socket) {
    socket.removeAllListeners();
    this._socketStates.delete(socket);
  }

  private _handleErrorCallback = this._handleError.bind(this);
  private _handleError(err: Error) {
    this.emit('error', err);
  }

  private _heartbeat() {
    for (const socket of this._socketStates.keys()) {
      // TODO: remove unresponding sockets
      socket.ping();
    }
  }
}

export const ServerP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    { require: ServerIdI, optional: true },
    WsServerI,
    BrokerI,
    { require: UpgradeVerifierI, optional: true },
    { require: LoginVerifierI, optional: true },
    Marshaler,
    ConfigsI,
  ],
  factory: (
    serverId,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin,
    marshaler,
    { heartbeatInterval }
  ) =>
    new WebSocketServer({
      id: serverId || undefined,
      wsServer,
      broker,
      marshaler,
      verifyUpgrade: verifyUpgrade || (() => true),
      verifyLogin:
        verifyLogin ||
        (async () => ({ ok: true, user: null, authContext: null })),
      heartbeatInterval,
    }),
})(WebSocketServer);

export type ServerP<User extends null | SociablyUser, Auth> = WebSocketServer<
  User,
  Auth
>;
