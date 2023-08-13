import { WebSocketServer as WsServer } from 'ws';

const createWsServer = (): WsServer => new WsServer({ noServer: true });

export default createWsServer;
