// @flow
/* eslint-disable import/prefer-default-export */
import { STATUS_CODES } from 'http';

export class LineAPIError extends Error {
  info: Object;
  code: number;

  constructor(code: number, body: Object) {
    super(
      body.message +
        (body.details
          ? `: ${body.details
              .map(
                ({ property, message }, i) =>
                  `${i + 1}. ${message}, at ${property}.`
              )
              .join(' ')}`
          : '')
    );

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LineAPIError);
    }

    this.code = code;
    this.name = STATUS_CODES[code];
    this.info = body;
  }
}
