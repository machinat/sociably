import type { GraphApiErrorInfo, GraphApiErrorBody } from './types';

export default class GraphApiError extends Error {
  info: GraphApiErrorInfo;

  constructor(body: GraphApiErrorBody) {
    super(body.error.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphApiError);
    }

    this.name = `GraphApiError (${body.error.type})`;
    this.info = body.error;
  }
}
