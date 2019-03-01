/* eslint-disable import/prefer-default-export */
export class LineAPIError extends Error {
  constructor(statusText, body) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
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

    this.name = statusText;
    this.info = body;
  }
}
