// @flow
type SuccessJobRes<Job, Result> = {|
  success: true,
  result: Result,
  error: void,
  job: Job,
|};

type FailJobRes<Job, Result> = {|
  success: false,
  result: Result,
  error: Error,
  job: Job,
|};

export type JobResponse<Job, Result> =
  | SuccessJobRes<Job, Result>
  | FailJobRes<Job, Result>;

export type BatchJobResponse<Job, Result> = {|
  success: boolean,
  errors: ?Array<Error>,
  batchResult: ?Array<void | JobResponse<Job, Result>>,
|};

export type BatchRequest<Job, Result> = {|
  begin: number,
  end: number,
  resolve: (BatchJobResponse<Job, Result>) => void,
  allAcquired: boolean,
  acquiredCount: number,
  response: BatchJobResponse<Job, Result>,
|};
