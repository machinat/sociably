import type { FailAPIResult } from './types';

export default class GraphAPIError extends Error {
  body: FailAPIResult;

  constructor(body: FailAPIResult) {
    super(`(#${body.error_code}) ${body.description || ''}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphAPIError);
    }

    this.name = `TelegramAPIError`;
    this.body = body;
  }
}
