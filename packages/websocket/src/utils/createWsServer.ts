import Ws from 'ws';

const createWsServer = (): Ws.Server => new Ws.Server({ noServer: true });

export default createWsServer;
