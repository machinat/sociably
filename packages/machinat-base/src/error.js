// @flow
import type { DispatchAction } from './types';

class DispatchError<Job, Result> extends Error {
  errors: $ReadOnlyArray<Error>;

  actions: DispatchAction<Job>[];
  results: (void | Result)[];

  constructor(
    errors: $ReadOnlyArray<Error>,
    actions: DispatchAction<Job>[],
    results: (void | Result)[]
  ) {
    const message = errors
      ? errors.reduce(
          (msg, err, idx) =>
            `${msg}\n\t${idx + 1}) ${err.name}: ${err.message ||
              err.toString()}`,
          'Errors happen while sending:'
        )
      : 'Unknown error happen while sending';

    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DispatchError);
    }

    this.errors = errors;
    this.actions = actions;
    this.results = results;
  }
}

export default DispatchError;
