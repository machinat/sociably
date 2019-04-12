// @flow
import http from 'http';
import uniqid from 'uniqid';

import type WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import type { MachinatAdaptor, EventHandler } from 'machinat-base/types';
import type { HTTPUpgradeReceiver } from 'machinat-http/types';
import type { WebEvent, WebBotOptions, ThreadUid } from './types';
import type ConnectionBroker from './broker';
import type { ConnectBody, DisconnectBody, EventBody } from './channel';

import Channel from './channel';
import WebThread from './thread';
import createEvent from './event';

type WebSocketServer = $ElementType<Class<WebSocket>, 'Server'>;

const WEB = 'web';

const rejectUpgrade = (socket: Socket, code: number, message?: string) => {
  const codeName = http.STATUS_CODES[code];
  const body = message || codeName;

  socket.write(
    `HTTP/1.1 ${code} ${codeName}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/html\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      `\r\n${body}`
  );

  socket.destroy();
};

class WebAdaptor
  implements HTTPUpgradeReceiver, MachinatAdaptor<void, WebThread, WebEvent> {
  webSocketServer: WebSocketServer;
  broker: ConnectionBroker;
  options: WebBotOptions;

  isBound: boolean;
  _handleEvent: EventHandler<void, WebThread, WebEvent>;
  _threadCache: Map<ThreadUid, WebThread>;

  _handleChannelConnect: (body: ConnectBody, seq: number) => void;
  _handleChannelDisconnect: (body: DisconnectBody, seq: number) => void;
  _handleChannelEvent: (body: EventBody, seq: number) => void;

  constructor(
    webSocketServer: WebSocketServer,
    broker: ConnectionBroker,
    options: WebBotOptions
  ) {
    this.webSocketServer = webSocketServer;
    this.broker = broker;
    this.options = options;
    this._threadCache = new Map();

    const adaptor = this;

    this._handleChannelConnect = function handleConnect(body: ConnectBody) {
      adaptor._handleChannelConnectImpl((this: Channel), body);
    };

    this._handleChannelDisconnect = function handleDisconnect(
      body: DisconnectBody
    ) {
      adaptor._handleChannelDisconnectImpl((this: Channel), body);
    };

    this._handleChannelEvent = function handleEvent(body: EventBody) {
      adaptor._handleChannelEventImpl((this: Channel), body);
    };
  }

  bind(handler: EventHandler<void, WebThread, WebEvent>) {
    if (this.isBound) {
      return false;
    }

    this.isBound = true;
    this._handleEvent = handler;
    return true;
  }

  unbind() {
    if (!this.isBound) {
      return false;
    }

    this.isBound = false;
    return true;
  }

  handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
    const request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      origin: req.headers.origin,
    };

    this.webSocketServer.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      const channel = new Channel(ws, uniqid(), request);

      channel.on('action', this._handleChannelEvent);

      channel.on('connect', this._handleChannelConnect);
      channel.on('disconnect', this._handleChannelDisconnect);
      channel.on('error', () => {
        // TODO: handle error
      });
    });
  }

  _getCachedThread(uid: ThreadUid): null | WebThread {
    let thread = this._threadCache.get(uid);

    if (thread === undefined) {
      thread = WebThread.fromUid(uid);

      if (thread !== null) {
        this._threadCache.set(uid, thread);
      }
    }

    return thread;
  }

  _issueEvent(
    uid: ThreadUid,
    channel: Channel,
    type: string,
    subtype: void | string,
    payload: any
  ) {
    const thread = this._getCachedThread(uid);
    if (thread === null) {
      this._issueError(new Error(xxx));
      return;
    }

    const info = this.broker.getLocalConnectionInfo(uid, channel.id);
    if (info === null) {
      this._issueError(new Error(xxx));
      return;
    }

    const event = createEvent(type, subtype, thread, channel.id, payload);
    this._handleEvent(WEB, event, {
      info,
      channelId: channel.id,
      request: channel.request,
    });
  }

  _handleChannelConnectImpl(channel: Channel, body: ConnectBody) {
    const { uid } = body;
    this._issueEvent(uid, channel, 'connect');
  }

  _handleChannelDisconnectImpl(channel: Channel, body: DisconnectBody) {
    const { uid } = body;
    this._issueEvent(uid, channel, 'disconnect');
  }

  _handleChannelEventImpl(channel: Channel, body: EventBody) {
    const { uid, type, subtype, payload } = body;
    this._issueEvent(uid, channel, type, subtype, payload);
  }
}

export default WebAdaptor;
