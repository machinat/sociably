import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { WebSocketServer as WsServer, WebSocket } from 'ws';
import thenifiedly from 'thenifiedly';

const createWsSocket: (
  wsServer: WsServer,
  req: IncomingMessage,
  ns: NetSocket,
  head: Buffer,
) => Promise<WebSocket> = thenifiedly.factory(
  (
    cb: (ws: WebSocket, req: IncomingMessage) => void,
    [wsServer, req, ns, head]: [WsServer, IncomingMessage, NetSocket, Buffer],
  ) => wsServer.handleUpgrade(req, ns, head, cb),
  { beginningError: false },
);

export default createWsSocket;
