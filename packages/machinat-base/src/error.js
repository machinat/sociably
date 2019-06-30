// @flow
import type { DispatchTask } from './types';

class DispatchError<Job, Result> extends Error {
  errors: $ReadOnlyArray<Error>;
  tasks: DispatchTask<Job>[];
  jobs: Job[];
  results: (void | Result)[];

  constructor(
    errors: $ReadOnlyArray<Error>,
    tasks: DispatchTask<Job>[],
    jobs: Job[],
    results: $ReadOnlyArray<void | Result>
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
    this.tasks = tasks;
    this.jobs = jobs;
    this.results = results;
  }
}

export default DispatchError;
