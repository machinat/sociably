import { STATUS_CODES } from 'http';
import type { FailApiResult } from './types';

export default class TwitterApiError extends Error {
  statusCode: number;
  detail: string;
  data?: FailApiResult;

  constructor(code: number, errorBody?: FailApiResult) {
    super(
      errorBody?.detail || `API returns status ${code} (${STATUS_CODES[code]})`
    );
    this.statusCode = code;
    this.name = `TwitterApiError (${errorBody?.title || STATUS_CODES[code]})`;
    this.data = errorBody;
  }
}
