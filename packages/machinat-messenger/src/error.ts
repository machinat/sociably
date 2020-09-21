import type { GraphAPIErrorInfo, GraphAPIErrorBody } from './types';

export default class GraphAPIError extends Error {
  info: GraphAPIErrorInfo;

  constructor(body: GraphAPIErrorBody) {
    super(body.error.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphAPIError);
    }

    this.name = `GraphAPIError (${body.error.type})`;
    this.info = body.error;
  }
}
