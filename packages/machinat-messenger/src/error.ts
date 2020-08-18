import { MESSENGER } from './constant';
import type { GraphAPIErrorInfo, GraphAPIErrorBody } from './types';

export class GraphAPIError extends Error {
  info: GraphAPIErrorInfo;

  constructor(body: GraphAPIErrorBody) {
    super(body.error.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphAPIError);
    }

    this.name = `GraphAPIError (${body.error.type})`;
    this.info = body.error;
  }
}

export class MessengerAuthError extends Error {
  code: number;
  platform = MESSENGER;

  constructor(code: number, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphAPIError);
    }

    this.code = code;
  }
}
