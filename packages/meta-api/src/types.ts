import type {
  SociablyChannel,
  EventContext,
  SociablyEvent,
  AnySociablyBot,
} from '@sociably/core';
import type { DispatchResponse } from '@sociably/core/engine';
import { WebhookMetadata } from '@sociably/http/webhook';

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
  };
  assetTag?: string;
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

export type MetaApiEventContext = EventContext<
  SociablyEvent<unknown>,
  WebhookMetadata,
  AnySociablyBot
>;

export type ListeningPlatformOptions<Context extends MetaApiEventContext> = {
  bot: Context['bot'];
  platform: Context['platform'];
  objectType: string;
  makeEventsFromUpdate: (raw) => Context['event'][];
  popEvent: (ctx: Context) => Promise<null>;
};

export type MetaApiModuleConfigs = {
  /** The webhook path to receive events. Default to `.` */
  webhookPath?: string;
  /** The Facebook app secret */
  appSecret: string;
  /** To verify the webhook request by the signature or not. Default to `true` */
  shouldVerifyRequest?: boolean;
  /** The secret string to verify the webhook challenge request */
  verifyToken: string;
  /** To handle the webhook challenge request or not. Default to `true` */
  shouldHandleChallenge?: boolean;
};
