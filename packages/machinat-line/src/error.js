// @flow
/* eslint-disable import/prefer-default-export */
import { STATUS_CODES } from 'http';

export class LineAPIError extends Error {
  info: Object;
  code: number;

  constructor(code: number, body: Object) {
    super(
      body.message
        ? body.message +
            (body.details
              ? `: ${body.details
                  .map((d, i) => `${i + 1}) ${d.message}, at ${d.property}.`)
                  .join(' ')}`
              : '')
        : body.error
        ? `${body.error}: ${body.error_description}`
        : JSON.stringify(body)
    );

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LineAPIError);
    }

    this.code = code;
    this.name = STATUS_CODES[code];
    this.info = body;
  }
}
