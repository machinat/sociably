// @flow
import type { IncomingMessage, ServerResponse } from 'http';

export interface HTTPReceiver {
  handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    rawBody?: string,
    httpContext?: any
  ): Promise<void>;
}

export interface HTTPReceivable {
  adaptor: HTTPReceiver;
}
