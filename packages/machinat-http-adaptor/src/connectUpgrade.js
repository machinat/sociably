// @flow
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import type { HTTPUpgradeReceivable } from './types';

const UPGRADE_404_RESPONSE =
  'HTTP/1.1 404 Not Found\r\n' +
  'Connection: close\r\n' +
  'Content-Type: text/html\r\n' +
  'Content-Length: 9\r\n' +
  '\r\nNot Found';

const connectUpgrade = (
  provider:
    | HTTPUpgradeReceivable
    | (IncomingMessage => HTTPUpgradeReceivable | void)
) => {
  let httpUpgradeBotConnector: (
    req: IncomingMessage,
    socket: Socket,
    head: Buffer
  ) => void;

  if (typeof provider === 'function') {
    const getBot = provider;

    httpUpgradeBotConnector = (
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
  } else {
    const bot = provider;

    httpUpgradeBotConnector = (
      req: IncomingMessage,
      socket: Socket,
      head: Buffer
    ) => {
      bot.receiver.handleUpgrade(req, socket, head);
    };
  }

  return httpUpgradeBotConnector;
};

export default connectUpgrade;
