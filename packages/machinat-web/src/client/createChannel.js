//  @flow
import Channel from '../channel';
import WebSocket from './ws';

const MACHINAT_WEB_PROTOCOL_V0 = 'machinat-web-v0';

const createChannel = (url: string) => {
  const webSocket = new WebSocket(url, MACHINAT_WEB_PROTOCOL_V0);

  return new Channel(webSocket, '');
};

export default createChannel;
