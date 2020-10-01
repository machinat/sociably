import { STATUS_CODES, IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { Server as WSServer } from 'ws';
import uniqid from 'uniqid';
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import type {
  MachinatUser,
  PopEventWrapper,
  PopEventFn,
  PopErrorFn,
} from '@machinat/core/types';
import type { UpgradeHandler } from '@machinat/http/types';

import { TransmitterP } from './transmitter';
import { BotP } from './bot';
import { ConnectionChannel } from './channel';
import createEvent from './event';
import {
  WS_SERVER_I,
  AUTHENTICATOR_I,
  UPGRADE_VERIFIER_I,
  PLATFORM_MOUNTER_I,
  PLATFORM_CONFIGS_I,
} from './interface';
import { WEBSOCKET } from './constant';
import type {
  VerifyLoginFn,
  UpgradeRequestInfo,
  WebSocketEventContext,
  VerifyUpgradeFn,
  WebSocketPlatformMounter,
  WebSocketPlatformConfigs,
} from './types';
import Socket, {
  DispatchBody,
  LoginBody,
  ConnectBody,
  DisconnectBody,
} from './socket';

type IntervalID = ReturnType<typeof setInterval>;

type ConnectionInfo<Auth> = {
  channel: ConnectionChannel;
  user: null | MachinatUser;
  auth: Auth;
  expireAt: null | Date;
};

type SocketState<Auth> = {
  lostHeartbeatCount: number;
  connections: Map<string, ConnectionInfo<Auth>>;
};

type WebSocketReceiverOptions<AuthInfo> = {
  heartbeatInterval?: number;
  verifyLogin?: VerifyLoginFn<AuthInfo, any>;
  verifyUpgrade?: VerifyUpgradeFn;
};

/** @internal */
const rejectUpgrade = (ns: NetSocket, code: number, message?: string) => {
  const codeName = STATUS_CODES[code] as string;
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

/** @internal */
const getWSFromServer = thenifiedly.factory(
  (cb, [wsServer, req, ns, head]) => wsServer.handleUpgrade(req, ns, head, cb),
  { beginningError: false }
);

/**
 * @category Provider
 */
export class WebSocketReceiver<AuthInfo> {
  private _serverId: string;
  private _bot: BotP;
  private _wsServer: WSServer;
  private _transmitter: TransmitterP;

  private _verifyUpgrade: VerifyUpgradeFn;
  private _verifyLogin: VerifyLoginFn<AuthInfo, any>;

  private _socketStates: Map<Socket, SocketState<AuthInfo>>;

  private _popEvent: PopEventFn<WebSocketEventContext<AuthInfo>, null>;
  private _popError: PopErrorFn;

  private _heartbeatIntervalId: IntervalID;

  constructor(
    bot: BotP,
    wsServer: WSServer,
    transmitter: TransmitterP,
    popEventWrapper: PopEventWrapper<WebSocketEventContext<AuthInfo>, null>,
    popError: PopErrorFn,
    {
      heartbeatInterval = 60000,
      verifyUpgrade,
      verifyLogin,
    }: WebSocketReceiverOptions<AuthInfo> = {}
  ) {
    this._serverId = transmitter.serverId;
    this._bot = bot;
    this._wsServer = wsServer;
    this._transmitter = transmitter;
    this._socketStates = new Map();

    this._verifyUpgrade = verifyUpgrade || (() => true);
    this._verifyLogin =
      verifyLogin ||
      (() =>
        Promise.resolve({ success: true, user: null, authInfo: null as any }));

    this._popEvent = popEventWrapper(() => Promise.resolve(null));
    this._popError = popError;

    this._heartbeatIntervalId = setInterval(
      this._heartbeat.bind(this),
      heartbeatInterval
    ).unref();
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

    const ws = await getWSFromServer(this._wsServer, req, ns, head);
    const socket = new Socket(uniqid(), ws, requestInfo);

    this._socketStates.set(socket, {
      lostHeartbeatCount: 0,
      connections: new Map(),
    });

    socket.on('dispatch', this._handleDispatchCallback);
    socket.on('login', this._handleLoginCallback);
    socket.on('connect', this._handleConnectCallback);
    socket.on('connect_fail', this._handleConnectFailCallback);
    socket.on('disconnect', this._handleDisconnectCallback);
    socket.on('close', this._handleCloseCallback);
    socket.on('error', this._popError);
  }

  handleUpgradeCallback(): UpgradeHandler {
    return this.handleUpgrade.bind(this);
  }

  private _getSocketStatesAssertedly(socket: Socket): SocketState<AuthInfo> {
    const socketState = this._socketStates.get(socket);
    if (socketState === undefined) {
      const reason = 'unknown socket';
      socket.close(3404, reason);
      throw new Error(reason);
    }

    return socketState;
  }

  private async _issueEvent(
    socket: Socket,
    kind: undefined | string,
    type: string,
    payload: any,
    { channel, user, auth }: ConnectionInfo<AuthInfo>
  ) {
    await this._popEvent({
      platform: WEBSOCKET,
      bot: this._bot,
      event: createEvent(kind, type, payload, channel, user),
      metadata: {
        source: WEBSOCKET,
        request: socket.request,
        auth,
      },
    });
  }

  private _handleLoginCallback = (
    body: LoginBody,
    seq: number,
    socket: Socket
  ) => {
    this._handleLogin(body, seq, socket).catch(this._popError);
  };

  private async _handleLogin(body: LoginBody, seq: number, socket: Socket) {
    const socketState = this._getSocketStatesAssertedly(socket);
    const connId: string = uniqid();

    try {
      const authResult = await this._verifyLogin(
        socket.request,
        body.credential
      );

      if (authResult.success) {
        const { authInfo, user, expireAt } = authResult;

        socketState.connections.set(connId, {
          user,
          auth: authInfo,
          channel: new ConnectionChannel(this._serverId, connId),
          expireAt: expireAt || null,
        });

        await socket.connect({ connId, seq });
      } else {
        await socket.reject({ seq, reason: authResult.reason });
      }
    } catch (err) {
      await socket.reject({ seq, reason: err.message });
    }
  }

  private _handleDispatchCallback = (
    body: DispatchBody,
    seq: number,
    socket: Socket
  ) => {
    this._handleDispatch(body, seq, socket).catch(this._popError);
  };

  private async _handleDispatch(
    body: DispatchBody,
    seq: number,
    socket: Socket
  ) {
    const socketState = this._getSocketStatesAssertedly(socket);

    const { connId, events } = body;
    const connInfo = socketState.connections.get(connId);

    if (connInfo === undefined) {
      // reject if not signed in
      await socket.disconnect({
        connId,
        reason: 'connection is not logged in',
      });
    } else {
      const issuingPromises = events.map(({ kind, type, payload }) =>
        this._issueEvent(socket, kind, type, payload, connInfo)
      );
      await Promise.all(issuingPromises);
    }
  }

  private _handleConnectCallback = (
    body: ConnectBody,
    seq: number,
    socket: Socket
  ) => {
    this._handleConnect(body, seq, socket).catch(this._popError);
  };

  private async _handleConnect(body: ConnectBody, seq: number, socket: Socket) {
    const socketState = this._getSocketStatesAssertedly(socket);

    const { connId } = body;
    const connInfo = socketState.connections.get(connId);

    if (connInfo === undefined) {
      // reject if not signed in
      await socket.disconnect({
        connId,
        reason: 'connection is not signed in',
      });
    } else {
      const { channel, user } = connInfo;
      this._transmitter.addLocalConnection(channel, socket, user);

      await this._issueEvent(
        socket,
        'connection',
        'connect',
        undefined,
        connInfo
      );
    }
  }

  private _handleConnectFailCallback = this._handleConnectFail.bind(this);

  private _handleConnectFail(
    body: DisconnectBody,
    seq: number,
    socket: Socket
  ) {
    const socketState = this._getSocketStatesAssertedly(socket);
    socketState.connections.delete(body.connId);
  }

  private _handleDisconnectCallback = (
    body: DisconnectBody,
    seq: number,
    socket: Socket
  ) => {
    this._handleDisconnect(body, seq, socket).catch(this._popError);
  };

  private async _handleDisconnect(
    body: DisconnectBody,
    seq: number,
    socket: Socket
  ) {
    const socketState = this._getSocketStatesAssertedly(socket);

    const { connId, reason } = body;
    const connInfo = socketState.connections.get(connId);

    if (connInfo !== undefined) {
      socketState.connections.delete(connId);
      this._transmitter.removeLocalConnection(connInfo.channel);

      await this._issueEvent(
        socket,
        'connection',
        'disconnect',
        { reason },
        connInfo
      );
    }
  }

  private _handleCloseCallback = this._handleClose.bind(this);

  private _handleClose(code: number, reason: string, socket: Socket) {
    socket.removeAllListeners();
    this._socketStates.delete(socket);
  }

  private _heartbeat() {
    for (const [socket, _] of this._socketStates) {
      // TODO: remove unresponding sockets
      socket.ping();
    }
  }
}

export const ReceiverP = provider<WebSocketReceiver<any>>({
  lifetime: 'singleton',
  deps: [
    BotP,
    WS_SERVER_I,
    TransmitterP,
    { require: AUTHENTICATOR_I, optional: true },
    { require: UPGRADE_VERIFIER_I, optional: true },
    PLATFORM_MOUNTER_I,
    PLATFORM_CONFIGS_I,
  ],
  factory: (
    bot: BotP,
    wsServer: WSServer,
    transmitter: TransmitterP,
    verifyLogin: null | VerifyLoginFn<any, any>,
    verifyUpgrade: null | VerifyUpgradeFn,
    { popEventWrapper, popError }: WebSocketPlatformMounter<any>,
    configs: WebSocketPlatformConfigs<any, any>
  ) =>
    new WebSocketReceiver(
      bot,
      wsServer,
      transmitter,
      popEventWrapper,
      popError,
      {
        heartbeatInterval: configs.heartbeatInterval,
        verifyLogin: verifyLogin || configs.verifyLogin,
        verifyUpgrade: verifyUpgrade || configs.verifyUpgrade,
      }
    ),
})(WebSocketReceiver);

export type ReceiverP<AuthInfo> = WebSocketReceiver<AuthInfo>;
