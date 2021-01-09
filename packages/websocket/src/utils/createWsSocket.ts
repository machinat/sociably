import WS from 'ws';
import { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import thenifiedly from 'thenifiedly';

const createWsSocket: (
  wsServer: WS.Server,
  req: IncomingMessage,
  ns: NetSocket,
  head: Buffer
) => Promise<WS> = thenifiedly.factory(
  (cb, [wsServer, req, ns, head]) => wsServer.handleUpgrade(req, ns, head, cb),
  { beginningError: false }
);

export default createWsSocket;
