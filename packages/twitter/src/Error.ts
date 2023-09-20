import { STATUS_CODES } from 'http';
import type { FailApiResult } from './types.js';

export default class TwitterApiError extends Error {
  statusCode: number;
  detail: string;
  data?: FailApiResult;

  constructor(code: number, body?: FailApiResult) {
    super(
      body?.detail ||
        body?.errors?.[0].message ||
        `API returns status ${code} (${STATUS_CODES[code]})`,
    );
    this.statusCode = code;
    this.name = `TwitterApiError (${body?.title || STATUS_CODES[code]})`;
    this.data = body;
  }
}
