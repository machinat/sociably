// @flow
/* eslint-disable import/prefer-default-export */
import type { MachinatNode } from 'machinat/types';
import type { JobResponse } from 'machinat-queue/types';
import type { MachinatAction } from 'machinat-renderer/types';

export class SendError<Rendered, Native, Job, Result> extends Error {
  errors: $ReadOnlyArray<Error>;
  node: MachinatNode;
  actions: null | MachinatAction<Rendered, Native>[];
  jobs: Job[];
  responses: null | $ReadOnlyArray<void | JobResponse<Job, Result>>;

  constructor(
    errors: $ReadOnlyArray<Error>,
    node: MachinatNode,
    actions: null | MachinatAction<Rendered, Native>[],
    jobs: Job[],
    responses: null | $ReadOnlyArray<void | JobResponse<Job, Result>>
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
      Error.captureStackTrace(this, SendError);
    }

    this.errors = errors;
    this.node = node;
    this.actions = actions;
    this.jobs = jobs;
    this.responses = responses;
  }
}
