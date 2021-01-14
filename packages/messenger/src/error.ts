import type { GraphApiErrorInfo, GraphApiErrorBody } from './types';

export default class GraphApiError extends Error {
  code: number;
  info: GraphApiErrorInfo;

  constructor({ error }: GraphApiErrorBody) {
    super(error.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphApiError);
    }

    this.name = `GraphAPIError (${error.type})`;
    this.info = error;
    this.code = error.code;
  }
}
