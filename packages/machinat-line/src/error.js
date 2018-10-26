/* eslint-disable import/prefer-default-export */
export class LineAPIError extends Error {
  constructor(statusText, body) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(body && body.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LineAPIError);
    }

    this.name = statusText;
    this.info = body;
  }
}
