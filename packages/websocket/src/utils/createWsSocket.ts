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
  (cb, [wsServer, req, ns, head]) => wsServer.handleUpgrade(req, ns, head, cb),
  { beginningError: false },
);

export default createWsSocket;
