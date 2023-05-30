import type { FailApiResult } from './types.js';

export default class TelegramApiError extends Error {
  body: FailApiResult;

  constructor(body: FailApiResult) {
    super(`(#${body.error_code}) ${body.description || ''}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TelegramApiError);
    }

    this.name = `TelegramAPIError`;
    this.body = body;
  }

  get code(): number {
    return this.body.error_code;
  }

  get description(): string {
    return this.body.description || 'unknown api error';
  }
}
