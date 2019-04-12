// @flow
/* eslint-disable import/prefer-default-export */

/**
 * Framework Error Codes
 *
 *
 *
 *
 *
 *
 *
 */

export class ConnectionError extends Error {
  code: number;
  reason: string;

  name = 'ConnectionError';

  constructor(code: number, reason: string) {
    super(`code ${code}, ${reason}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionError);
    }

    this.code = code;
    this.reason = reason;
  }
}
