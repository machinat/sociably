// @flow
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import type { HTTPUpgradeReceiver, HTTPUpgradeReceivable } from './types';

const UPGRADE_404_RESPONSE =
  'HTTP/1.1 404 Not Found\r\n' +
  'Connection: close\r\n' +
  'Content-Type: text/html\r\n' +
  'Content-Length: 9\r\n' +
  '\r\nNot Found';

const connectUpgrade = <Recevier: HTTPUpgradeReceiver>(
  provider:
    | HTTPUpgradeReceivable<Recevier>
    | (IncomingMessage => HTTPUpgradeReceivable<Recevier> | void)
): ((req: IncomingMessage, socket: Socket, head: Buffer) => void) => {
  if (typeof provider === 'function') {
    const getBot = provider;

    const httpUpgradeBotConnector = (
      req: IncomingMessage,
      socket: Socket,
      head: Buffer
    ) => {
      const bot = getBot(req);

      if (bot === undefined) {
        socket.write(UPGRADE_404_RESPONSE);
        socket.destroy();
        return;
      }

      bot.receiver.handleUpgrade(req, socket, head);
    };

    return httpUpgradeBotConnector;
  }

  return provider.receiver.callback();
};

export default connectUpgrade;
