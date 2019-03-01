// @flow
/* eslint-disable import/prefer-default-export */
import type { GraphAPIErrorInfo, GraphAPIErrorBody } from './types';

export class GraphAPIError extends Error {
  info: GraphAPIErrorInfo;

  constructor(body: GraphAPIErrorBody) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(body.error.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphAPIError);
    }

    this.name = body.error.type;
    this.info = body.error;
  }
}
