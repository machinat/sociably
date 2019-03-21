// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';

export interface HTTPRequestReceiver {
  handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    httpContext?: Object,
    rawBody?: string
  ): void;
}

export interface HTTPRequestReceivable {
  adaptor: HTTPRequestReceiver;
}

export interface HTTPUpgradeReceiver {
  handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): void;
}

export interface HTTPUpgradeReceivable {
  adaptor: HTTPUpgradeReceiver;
}
