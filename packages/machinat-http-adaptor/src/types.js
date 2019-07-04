// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';

export type RequestCallback = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => void;

export interface HTTPRequestReceiver {
  +handleRequest: RequestCallback;
  callback(): RequestCallback;
}

export interface HTTPRequestReceivable<R: HTTPRequestReceiver> {
  receiver: R;
}

export type UpgradeCallback = (
  req: IncomingMessage,
  socket: Socket,
  head: Buffer
) => void;

export interface HTTPUpgradeReceiver {
  +handleUpgrade: UpgradeCallback;
  callback(): UpgradeCallback;
}

export interface HTTPUpgradeReceivable<R: HTTPUpgradeReceiver> {
  receiver: R;
}
