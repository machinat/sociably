import Ws from 'ws';
import { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import thenifiedly from 'thenifiedly';

const createWsSocket: (
  wsServer: Ws.Server,
  req: IncomingMessage,
  ns: NetSocket,
  head: Buffer
) => Promise<Ws> = thenifiedly.factory(
  (cb, [wsServer, req, ns, head]) => wsServer.handleUpgrade(req, ns, head, cb),
  { beginningError: false }
);

export default createWsSocket;
