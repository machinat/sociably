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
  WebSocketBotOptions,
  RegisterResponse,
  WebSocketResponse,
  ConnectionInfo,
  ThreadUid,
} from './types';
import type Distributor from './distributor';
import type Socket, {
  ConnectBody,
  DisconnectBody,
  EventBody,
  RegisterBody,
} from './socket';

import MachinatSocket from './socket';
import WebSocketThread from './thread';
import createEvent from './event';

type WebSocketServer = $ElementType<Class<WebSocket>, 'Server'>;

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
    MachinatReceiver<WebSocketResponse, WebSocketThread, WebSocketEvent> {
  _webSocketServer: WebSocketServer;
  _distributor: Distributor;
  options: WebSocketBotOptions;

  _threadCache: Map<ThreadUid, WebSocketThread>;

  isBound: boolean;
  _handleEvent: EventHandler<
    WebSocketResponse,
    WebSocketThread,
    WebSocketEvent
  >;
  _handleError: (e: Error) => void;

  _handleSocketConnect: (body: ConnectBody, seq: number) => void;
  _handleSocketDisconnect: (body: DisconnectBody, seq: number) => void;
  _handleSocketEvent: (body: EventBody, seq: number) => void;

  constructor(
    webSocketServer: WebSocketServer,
    distributor: Distributor,
    options: WebSocketBotOptions
  ) {
    this._webSocketServer = webSocketServer;
    this._distributor = distributor;
    this.options = options;

    distributor.setAuthenticator(this._handleRegisterAuth);

    distributor.on('event', this._handleSocketEvent);
    distributor.on('connect', this._handleSocketConnect);
    distributor.on('disconnect', this._handleSocketDissconnect);
  }

  bind(
    handler: EventHandler<WebSocketResponse, WebSocketThread, WebSocketEvent>,
    handleError: (e: Error) => void
  ) {
    if (this.isBound) {
      return false;
    }

    this.isBound = true;
    this._handleEvent = handler;
    this._handleError = handleError;
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
    if (this.options.verifyUpgrade) {
      const allowed = this.options.verifyUpgrade(req);

      if (!allowed) {
        rejectUpgrade(ns, 400);
        return;
      }
    }

    const request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
    };

    this._webSocketServer.handleUpgrade(req, ns, head, (ws: WebSocket) => {
      const socket = new MachinatSocket(ws, uniqid(), request);
      this._distributor.addSocket(socket);
    });
  }

  _getCachedThread(uid: ThreadUid): null | WebSocketThread {
    let thread = this._threadCache.get(uid);

    if (thread === undefined) {
      thread = WebSocketThread.fromUid(uid);

      if (thread !== null) {
        this._threadCache.set(uid, thread);
      }
    }

    return thread;
  }

  async _issueEvent(
    uid: ThreadUid,
    socket: Socket,
    type: string,
    subtype: void | string,
    payload: any,
    info: ConnectionInfo
  ) {
    const thread = this._getCachedThread(uid);
    if (thread === null) {
      this._handleError(new Error(xxx));
      return;
    }

    const event = createEvent(type, subtype, thread, socket.id, payload);

    try {
      await this._handleEvent(WEBSOCKET, event, {
        info,
        socketId: socket.id,
        request: socket.request,
      });
    } catch (err) {
      this._handleError(err);
    }
  }

  _handleRegisterAuth = async (
    socket: Socket,
    body: RegisterBody
  ): Promise<RegisterResponse> => {
    const thread = new WebSocketThread('@socket', undefined, socket.id);
    const event = createEvent('@register', undefined, thread, socket.id, body);

    const response: WebSocketResponse = await this._handleEvent(
      WEBSOCKET,
      event,
      { socketId: socket.id, request: socket.request }
    );

    return response || { accepted: false, code: 0.0, reason: '????????' };
  };

  _handleSocketEvent = (
    socket: Socket,
    uid: ThreadUid,
    info: ConnectionInfo,
    body: EventBody
  ) => {
    const { type, subtype, payload } = body;
    this._issueEvent(uid, socket, type, subtype, payload, info);
  };

  _handleSocketConnect = (
    socket: Socket,
    uid: ThreadUid,
    info: ConnectionInfo
  ) => {
    this._issueEvent(uid, socket, '@connect', undefined, undefined, info);
  };

  _handleSocketDissconnect = (
    socket: Socket,
    uid: ThreadUid,
    info: ConnectionInfo
  ) => {
    this._issueEvent(uid, socket, '@disconnect', undefined, undefined, info);
  };
}

export default WebSocketReceiver;
