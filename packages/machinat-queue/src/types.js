// @flow
export type JobResponse<Job, Result> = {|
  success: boolean,
  payload: Result,
  job: Job,
|};

export type BatchResponse<Job, Result> = {|
  success: boolean,
  errors: ?Array<Error>,
  batchResult: ?Array<void | JobResponse<Job, Result>>,
|};

export type BatchRequest<Job, Result> = {|
  begin: number,
  end: number,
  resolve: (BatchResponse<Job, Result>) => void,
  allAcquired: boolean,
  acquiredCount: number,
  response: BatchResponse<Job, Result>,
|};
