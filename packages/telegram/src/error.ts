import type { FailApiResult } from './types';

export default class TelegramApiError extends Error {
  body: FailApiResult;

  constructor(body: FailApiResult) {
    super(`(#${body.error_code}) ${body.description || ''}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TelegramApiError);
    }

    this.name = `TelegramApiError`;
    this.body = body;
  }
}
