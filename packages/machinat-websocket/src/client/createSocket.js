//  @flow
import MachinatSocket from '../socket';
import WebSocket from './ws';

const MACHINAT_WEB_PROTOCOL_V0 = 'machinat-web-v0';

const createSocket = (url: string) => {
  const webSocket = new WebSocket(url, MACHINAT_WEB_PROTOCOL_V0);

  return new MachinatSocket(webSocket, '');
};

export default createSocket;
