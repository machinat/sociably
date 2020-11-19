import type { FailAPIResult } from './types';

export default class TelegramAPIError extends Error {
  body: FailAPIResult;

  constructor(body: FailAPIResult) {
    super(`(#${body.error_code}) ${body.description || ''}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TelegramAPIError);
    }

    this.name = `TelegramAPIError`;
    this.body = body;
  }
}
