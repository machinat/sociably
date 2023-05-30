import type { SociablyChannel } from '@sociably/core';
import type { DispatchResponse } from '@sociably/core/engine';

export type FileInfo = {
  filename?: string;
  contentType?: string;
};

export type MetaApiJobRequest = {
  method: string;
  url: string;
  params?: Record<string, unknown>;
};

type AccomplishRequestFn = (
  request: MetaApiJobRequest,
  keys: string[],
  getResultValue: (key: string, path: string) => string | null
) => MetaApiJobRequest;

export type MetaApiJob = {
  request: MetaApiJobRequest;
  channel?: SociablyChannel;
  asApplication?: boolean;
  accessToken?: string;
  key?: string;
  file?: {
    data: string | Buffer | NodeJS.ReadableStream;
    info?: FileInfo;
    assetTag?: string;
  };
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
  body?: string;
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
