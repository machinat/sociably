// @flow
/* eslint-disable import/prefer-default-export */

export class ConnectionError extends Error {
  code: number;
  reason: string;

  name = 'ConnectionError';

  // TODO: error code
  constructor(/* code: number, */ reason: string) {
    super(reason);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionError);
    }

    // this.code = code;
    this.reason = reason;
  }
}
