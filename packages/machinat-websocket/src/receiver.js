// @flow
import http from 'http';
import uniqid from 'uniqid';
import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';

import { provider } from '@machinat/core/service';
import type {
  MachinatUser,
  PopEventWrapper,
  PopEventFn,
  PopErrorFn,
} from '@machinat/core/types';
import Transmitter from './transmitter';
import WebSocketBot from './bot';
import MachinatSocket from './socket';
import { ConnectionChannel } from './channel';
import createEvent from './event';
import {
  WEBSOCKET,
  WSServerI,
  SIGN_IN_VERIFIER_I,
  UPGRADE_VERIFIER_I,
  WEBSOCKET_PLATFORM_MOUNTER_I,
} from './constant';
import type {
  WebSocketEvent,
  RequestInfo,
  VerifySignInFn,
  WebSocketEventContext,
  VerifyUpgradeFn,
  WebSocketPlatformMounter,
} from './types';
import type Socket, {
  DispatchBody,
  SignInBody,
  ConnectBody,
  DisconnectBody,
} from './socket';

type ConnectionInfo<Auth> = {|
  channel: ConnectionChannel,
  user: null | MachinatUser,
  auth: Auth,
  expireAt: null | Date,
|};

type SocketState<Auth> = {|
  lostHeartbeatCount: number,
  connections: Map<string, ConnectionInfo<Auth>>,
|};

const rejectUpgrade = (ns: NetSocket, code: number, message?: string) => {
  const codeName = http.STATUS_CODES[code];
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

class WebSocketReceiver<AuthInfo> {
  _serverId: string;
  _bot: WebSocketBot;
  _wsServer: WSServerI;
  _transmitter: Transmitter;

  _verifyUpgrade: (request: RequestInfo) => boolean;
  _verifySignIn: VerifySignInFn<AuthInfo, any>;

  _socketStates: Map<Socket, SocketState<AuthInfo>>;

  _popEvent: PopEventFn<WebSocketEventContext<AuthInfo>, null>;
  _popError: PopErrorFn;

  constructor(
    bot: WebSocketBot,
    wsServer: WSServerI,
    transmitter: Transmitter,
    verifySignIn: null | VerifySignInFn<AuthInfo, any>,
    verifyUpgrade: null | VerifyUpgradeFn,
    popEventWrapper: PopEventWrapper<WebSocketEventContext<AuthInfo>, null>,
    popError: PopErrorFn
  ) {
    this._serverId = transmitter.serverId;
    this._bot = bot;
    this._wsServer = wsServer;
    this._transmitter = transmitter;
    this._socketStates = new Map();

    this._verifyUpgrade = verifyUpgrade || (() => true);
    this._verifySignIn =
      verifySignIn ||
      (() =>
        Promise.resolve({ success: true, user: null, authInfo: (null: any) }));

    this._popEvent = popEventWrapper(() => Promise.resolve(null));
    this._popError = popError;
  }

  handleUpgrade(req: IncomingMessage, ns: NetSocket, head: Buffer) {
    const requestInfo = {
      method: req.method,
      url: req.url,
      headers: req.headers,
    };

    const allowed = this._verifyUpgrade(requestInfo);
    if (!allowed) {
      rejectUpgrade(ns, 400);
      return;
    }

    this._wsServer.handleUpgrade(req, ns, head, ws => {
      const socket = new MachinatSocket(uniqid(), ws, requestInfo);
      this._socketStates.set(socket, {
        lostHeartbeatCount: 0,
        connections: new Map(),
      });

      socket.on('dispatch', this._handleDispatchCallback);
      socket.on('sign_in', this._handleSignInCallback);
      socket.on('connect', this._handleConnectCallback);
      socket.on('connect_fail', this._handleConnectFailCallback);
      socket.on('disconnect', this._handleDisconnectCallback);
      socket.on('close', this._handleCloseCallback);
      socket.on('error', this._popError);
    });
  }

  handleUpgradeCallback() {
    return this.handleUpgrade.bind(this);
  }

  _getSocketStatesAssertedly(socket: Socket): SocketState<AuthInfo> {
    const socketState = this._socketStates.get(socket);
    if (socketState === undefined) {
      const reason = 'unknown socket';
      socket.close(3404, reason);
      throw new Error(reason);
    }

    return socketState;
  }

  async _issueEvent(
    socket: Socket,
    event: WebSocketEvent,
    { channel, user, auth }: ConnectionInfo<AuthInfo>
  ) {
    await this._popEvent({
      platform: WEBSOCKET,
      bot: this._bot,
      channel,
      user,
      event,
      metadata: {
        source: WEBSOCKET,
        request: socket.request,
        auth,
      },
    });
  }

  _handleSignInCallback = (body: SignInBody, seq: number, socket: Socket) => {
    this._handleSignIn(body, seq, socket).catch(this._popError);
  };

  async _handleSignIn(body: SignInBody, seq: number, socket: Socket) {
    const socketState = this._getSocketStatesAssertedly(socket);
    const connId: string = uniqid();

    try {
      const authResult = await this._verifySignIn(
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

  _handleDispatchCallback = (
    body: DispatchBody,
    seq: number,
    socket: Socket
  ) => {
    this._handleDispatch(body, seq, socket).catch(this._popError);
  };

  async _handleDispatch(body: DispatchBody, seq: number, socket: Socket) {
    const socketState = this._getSocketStatesAssertedly(socket);

    const { connId, events } = body;
    const connInfo = socketState.connections.get(connId);

    if (connInfo === undefined) {
      // reject if not signed in
      await socket.disconnect({
        connId,
        reason: 'connection is not signed in',
      });
    } else {
      const issuingPromises = events.map(({ type, subtype, payload }) =>
        this._issueEvent(socket, createEvent(type, subtype, payload), connInfo)
      );
      await Promise.all(issuingPromises);
    }
  }

  _handleConnectCallback = (body: ConnectBody, seq: number, socket: Socket) => {
    this._handleConnect(body, seq, socket).catch(this._popError);
  };

  async _handleConnect(body: ConnectBody, seq: number, socket: Socket) {
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
        createEvent('connect', undefined, undefined),
        connInfo
      );
    }
  }

  _handleConnectFailCallback = this._handleConnectFail.bind(this);

  _handleConnectFail(body: DisconnectBody, seq: number, socket: Socket) {
    const socketState = this._getSocketStatesAssertedly(socket);
    socketState.connections.delete(body.connId);
  }

  _handleDisconnectCallback = (
    body: DisconnectBody,
    seq: number,
    socket: Socket
  ) => {
    this._handleDisconnect(body, seq, socket).catch(this._popError);
  };

  async _handleDisconnect(body: DisconnectBody, seq: number, socket: Socket) {
    const socketState = this._getSocketStatesAssertedly(socket);

    const { connId, reason } = body;
    const connInfo = socketState.connections.get(connId);

    if (connInfo !== undefined) {
      socketState.connections.delete(connId);
      this._transmitter.removeLocalConnection(connInfo.channel);

      await this._issueEvent(
        socket,
        createEvent('disconnect', undefined, { reason }),
        connInfo
      );
    }
  }

  _handleCloseCallback = this._handleClose.bind(this);

  _handleClose(code, reason, socket: Socket) {
    socket.removeAllListeners();
    this._socketStates.delete(socket);
  }
}

export default provider<WebSocketReceiver<any>>({
  lifetime: 'singleton',
  deps: [
    WebSocketBot,
    WSServerI,
    Transmitter,
    { require: SIGN_IN_VERIFIER_I, optional: true },
    { require: UPGRADE_VERIFIER_I, optional: true },
    WEBSOCKET_PLATFORM_MOUNTER_I,
  ],
  factory: (
    bot: WebSocketBot,
    wsServer: WSServerI,
    transmitter: Transmitter,
    verifySignIn: null | VerifySignInFn<any, any>,
    verifyUpgrade: null | VerifyUpgradeFn,
    { popEventWrapper, popError }: WebSocketPlatformMounter<any>
  ) =>
    new WebSocketReceiver(
      bot,
      wsServer,
      transmitter,
      verifySignIn,
      verifyUpgrade,
      popEventWrapper,
      popError
    ),
})(WebSocketReceiver);
