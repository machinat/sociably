// eslint-disable-next-line import/prefer-default-export
export class GraphAPIError extends Error {
  constructor(body) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(body.error.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphAPIError);
    }

    this.name = body.error.type;
    this.info = body.error;
  }
}
