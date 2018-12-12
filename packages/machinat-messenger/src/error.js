// @flow
// eslint-disable-next-line import/prefer-default-export
import type { BatchJobResponse } from 'machinat-queue/types';

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

export class MachinatSendError<J, R> extends Error {
  _batchJobResponse: BatchJobResponse<J, R>;
  // _batchJobIterator: Iterator<>;

  constructor(batchJobRes: BatchJobResponse<J, R>, batchIterator) {
    const message = batchJobRes.errors
      ? batchJobRes.errors.reduce(
          (msg, err) => `${msg}\n\n\t${err.stack || err.toString()}`,
          'Errors happen while sending:'
        )
      : 'Unknown error happen while sending';

    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MachinatSendError);
    }

    this._batchJobResponse = batchJobRes;
  }
}
