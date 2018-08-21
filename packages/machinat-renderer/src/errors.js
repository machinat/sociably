// eslint-disable-next-line import/prefer-default-export
export class ExecutionError extends Error {
  constructor(reason, jobsResult) {
    super(reason);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExecutionError);
    }
    this.name = 'ExecutionError';
    this.reason = reason;
    this.result = jobsResult;
  }
}
