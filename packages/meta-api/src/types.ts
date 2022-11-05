import type { DispatchResponse } from '@sociably/core/engine';

export type FileInfo = {
  filename?: string;
  filepath?: string;
  contentType?: string;
  knownLength?: number;
};

type AccomplishRequestFn = (
  request: MetaBatchRequest,
  keys: string[],
  getResultValue: (key: string, path: string) => string | null
) => MetaBatchRequest;

export type MetaApiJob = {
  request: MetaBatchRequest;
  key?: string;
  assetTag?: string;
  fileData?: string | Buffer | NodeJS.ReadableStream;
  fileInfo?: FileInfo;
  registerResult?: string;
  consumeResult?: {
    keys: string[];
    accomplishRequest: AccomplishRequestFn;
  };
};

export type MetaApiResult = {
  code: number;
  headers: Record<string, string>;
  body: MetaApiResponseBody;
};

export type MetaApiDispatchResponse = DispatchResponse<
  MetaApiJob,
  MetaApiResult
>;

/* eslint-disable camelcase */
export type MetaBatchRequest = {
  method: string;
  relative_url: string;
  body: null | Record<string, unknown>;
  name?: string;
  depends_on?: string;
  attached_files?: string;
  omit_response_on_success?: boolean;
};

export type MetaApiResponseBody = Record<string, any>;

export type MetaApiErrorInfo = {
  message: string;
  type: string;
  code: number;
  error_subcode: number;
  fbtrace_id: string;
};

export type GraphApiErrorBody = {
  error: MetaApiErrorInfo;
};
