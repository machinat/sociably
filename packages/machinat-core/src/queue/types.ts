export type SuccessJobResponse<Job, Result> = {
  success: true;
  result: Result;
  error: void;
  job: Job;
};

export type FailedJobResponse<Job, Result> = {
  success: false;
  result: Result;
  error: Error;
  job: Job;
};

export type JobResponse<Job, Result> =
  | SuccessJobResponse<Job, Result>
  | FailedJobResponse<Job, Result>;

export type SuccessJobBatchResponse<Job, Result> = {
  success: true;
  errors: null;
  batch: ReadonlyArray<SuccessJobResponse<Job, Result>>;
};

export type FailedJobBatchResponse<Job, Result> = {
  success: false;
  errors: Array<Error>;
  batch: null | Array<void | JobResponse<Job, Result>>;
};

export type JobBatchResponse<Job, Result> =
  | SuccessJobBatchResponse<Job, Result>
  | FailedJobBatchResponse<Job, Result>;
