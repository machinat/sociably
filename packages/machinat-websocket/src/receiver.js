// @flow
import http from 'http';
import uniqid from 'uniqid';

import type WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { MachinatReceiver, EventHandler } from 'machinat-base/types';
import type { HTTPUpgradeReceiver } from 'machinat-http-adaptor/types';
import type {
  WebSocketEvent,
  WebSocketTransport,
  WebSocketBotOptions,
  RegisterResponse,
  WebSocketResponse,
  ConnectionInfo,
  ChannelUid,
} from './types';
import type Distributor from './distributor';
import type Socket, { EventBody, RegisterBody } from './socket';

import MachinatSocket from './socket';
import WebSocketChannel from './channel';
import createEvent from './event';
import { ConnectionError } from './error';

type WebSocketServer = $ElementType<WebSocket, 'Server'>;

const WEBSOCKET = 'websocket';

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

class WebSocketReceiver
  implements
    HTTPUpgradeReceiver,
    MachinatReceiver<
      WebSocketResponse,
      WebSocketChannel,
      WebSocketEvent,
      WebSocketTransport
    > {
  _webSocketServer: WebSocketServer;
  _distributor: Distributor;
  options: WebSocketBotOptions;

  _channelCache: Map<ChannelUid, WebSocketChannel>;

  isBound: boolean;
  _issueEvent: EventHandler<
    WebSocketResponse,
    WebSocketChannel,
    WebSocketEvent,
    WebSocketTransport
  >;
  _issueError: (e: Error) => void;

  constructor(
    webSocketServer: WebSocketServer,
    distributor: Distributor,
    options: WebSocketBotOptions
  ) {
    this.options = options;
    this._webSocketServer = webSocketServer;
    this._distributor = distributor;
    this._channelCache = new Map();

    distributor.setAuthenticator(this._handleRegisterAuth);

    distributor.on('event', this._handleSocketEvent);
    distributor.on('connect', this._handleConnect);
    distributor.on('disconnect', this._handleDisconnect);
    distributor.on('error', this._handleDistributorError);
  }

  bind(
    handleEvent: EventHandler<
      WebSocketResponse,
      WebSocketChannel,
      WebSocketEvent,
      WebSocketTransport
    >,
    handleError: (e: Error) => void
  ) {
    if (this.isBound) {
      return false;
    }

    this.isBound = true;
    this._issueEvent = handleEvent;
    this._issueError = handleError;
    return true;
  }

  unbind() {
    if (!this.isBound) {
      return false;
    }

    this.isBound = false;
    return true;
  }

  handleUpgrade(req: IncomingMessage, ns: NetSocket, head: Buffer) {
    const requestInfo = {
      method: req.method,
      url: req.url,
      headers: req.headers,
    };

    if (this.options.verifyUpgrade) {
      const allowed = this.options.verifyUpgrade(requestInfo);

      if (!allowed) {
        rejectUpgrade(ns, 400);
        return;
      }
    }

    this._webSocketServer.handleUpgrade(req, ns, head, (ws: WebSocket) => {
      const socket = new MachinatSocket(ws, uniqid(), requestInfo);
      this._distributor.consignSocket(socket);
    });
  }

  _getCachedChannel(uid: ChannelUid): null | WebSocketChannel {
    let channel = this._channelCache.get(uid);

    if (channel === undefined) {
      channel = WebSocketChannel.fromUid(uid);

      if (channel !== null) {
        this._channelCache.set(uid, channel);
      }
    }

    return channel;
  }

  async _processEvent(
    uid: ChannelUid,
    socket: Socket,
    type: string,
    subtype: void | string,
    payload: any,
    connectionInfo: ConnectionInfo
  ) {
    const channel = this._getCachedChannel(uid);
    if (channel === null) {
      this._issueError(
        new ConnectionError(`invalid channel uid [${uid}] received`)
      );
      return;
    }

    const event = createEvent(type, subtype, payload);

    try {
      await this._issueEvent(channel, event, {
        source: WEBSOCKET,
        connectionInfo,
        socketId: socket.id,
        request: (socket.request: any), // request exist at server side
      });
    } catch (err) {
      this._issueError(err);
    }
  }

  _handleRegisterAuth = async (
    socket: Socket,
    body: RegisterBody
  ): Promise<RegisterResponse> => {
    const channel = new WebSocketChannel('@socket', undefined, socket.id);
    const event = createEvent('@register', undefined, body);
    try {
      const response: WebSocketResponse = await this._issueEvent(
        channel,
        event,
        {
          source: WEBSOCKET,
          socketId: socket.id,
          request: (socket.request: any), // request exist at server side
        }
      );

      return (
        response || { accepted: false, reason: 'no registration middleware' }
      );
    } catch (e) {
      return { accepted: false, reason: e.message };
    }
  };

  _handleSocketEvent = (
    socket: Socket,
    uid: ChannelUid,
    info: ConnectionInfo,
    body: EventBody
  ) => {
    const { type, subtype, payload } = body;
    this._processEvent(uid, socket, type, subtype, payload, info);
  };

  _handleConnect = (socket: Socket, uid: ChannelUid, info: ConnectionInfo) => {
    this._processEvent(uid, socket, '@connect', undefined, undefined, info);
  };

  _handleDisconnect = (
    socket: Socket,
    uid: ChannelUid,
    info: ConnectionInfo
  ) => {
    this._processEvent(uid, socket, '@disconnect', undefined, undefined, info);
  };

  _handleDistributorError = (err: Error) => {
    this._issueError(err);
  };
}

export default WebSocketReceiver;
