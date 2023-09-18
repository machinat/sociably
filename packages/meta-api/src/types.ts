import { Readable } from 'stream';
import type {
  SociablyChannel,
  EventContext,
  SociablyEvent,
  AnySociablyBot,
} from '@sociably/core';
import type { DispatchResponse } from '@sociably/core/engine';
import { WebhookMetadata } from '@sociably/http/webhook';

export type MetaApiJobRequest = {
  method: string;
  url: string;
  params?: Record<string, unknown>;
};

type AccomplishRequestFn = (
  request: MetaApiJobRequest,
  keys: string[],
  getResultValue: (key: string, path: string) => string | null,
) => MetaApiJobRequest;

export type MetaApiUploadingFile = {
  data: string | Buffer | Readable;
  fileName?: string;
  contentType?: string;
  contentLength?: number;
};

export type MetaApiJob = {
  request: MetaApiJobRequest;
  channel?: SociablyChannel;
  asApp?: boolean;
  accessToken?: string;
  key?: string;
  file?: MetaApiUploadingFile;
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

export type MetaApiChannel = SociablyChannel & {
  id: string;
};

export type MetaRequestApiOptions<Channel extends MetaApiChannel> = {
  /** The channel to execute the operation with */
  channel?: string | Channel;
  /** HTTP method */
  method?: string;
  /** API request URL relative to https://graph.facebook.com/{version}/ */
  url: string;
  /** API request parameters */
  params?: Record<string, unknown>;
  /** Make the API call as the FB app */
  asApp?: boolean;
  /** Force to use the access token */
  accessToken?: string;
};

export type MetaApiBot<Channel extends MetaApiChannel> = {
  requestApi<ResBody extends MetaApiResponseBody>(
    options: MetaRequestApiOptions<Channel>,
  ): Promise<ResBody>;
};

export type MetaWebhookObjectType =
  | 'user'
  | 'page'
  | 'permissions'
  | 'payments'
  | 'instagram'
  | 'whatsapp_business_account';

export type SetMetaAppSubscriptionOptions = {
  /**
   * Indicates the object type that this subscription applies to. Default to
   * `page`
   */
  objectType: MetaWebhookObjectType;
  /** One or more of the set of valid fields in this object to subscribe to */
  fields: string[];
  /** The URL to receive the webhook */
  webhookUrl: string;
  /** Specify the verify token for registering the webhook */
  webhookVerifyToken: string;
  /** Specify the app to remove subscriptions for */
  appId: string;
};

export type DeleteMetaAppSubscriptionOptions = {
  /** Specify the app to remove subscriptions for */
  appId: string;
  /**
   * One or more of the set of valid fields in this object to subscribe to. If
   * not specified, subscriptios of all the fields is removed.
   */
  fields?: string[];
  /**
   * A specific object type to remove subscriptions for. If this optional field
   * is not included, all subscriptions for this app will be removed.
   */
  objectType?: MetaWebhookObjectType;
};
