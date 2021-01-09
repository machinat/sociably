import WS from 'ws';

const createWsServer = (): WS.Server => new WS.Server({ noServer: true });

export default createWsServer;
