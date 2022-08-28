import type { MetaApiErrorInfo, GraphApiErrorBody } from './types';

export default class MetaApiError extends Error {
  code: number;
  info: MetaApiErrorInfo;

  constructor({ error }: GraphApiErrorBody) {
    super(error.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MetaApiError);
    }

    this.name = `GraphAPIError (${error.type})`;
    this.info = error;
    this.code = error.code;
  }
}
