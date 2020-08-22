/* eslint-disable import/prefer-default-export */
import { STATUS_CODES } from 'http';

export class LineAPIError extends Error {
  info: any;
  code: number;
  status: string;

  constructor(code: number, body: any) {
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
    this.status = STATUS_CODES[code] as string;
    this.name = `LineAPIError (${this.status})`;
    this.info = body;
  }
}
