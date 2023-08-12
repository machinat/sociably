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

export type MetaApiBotRequestApiOptions = {
  /** HTTP method */
  method?: string;
  /** API request URL relative to https://graph.facebook.com/{version}/ */
  url: string;
  /** API request parameters */
  params?: Record<string, unknown>;
  /** Make the API call as the FB app */
  asApplication?: boolean;
  /** Force to use the access token */
  accessToken?: string;
};

export type MetaApiBot = {
  requestApi<ResBody extends MetaApiResponseBody>(
    options: MetaApiBotRequestApiOptions
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
  /** The URL to receive the webhook */
  webhookUrl: string;
  /** Indicates the object type that this subscription applies to. Default to `page` */
  objectType: MetaWebhookObjectType;
  /** One or more of the set of valid fields in this object to subscribe to */
  fields: string[];
  /** Specify the verify token to confirm the webhook with */
  verifyToken: string;
  /** Specify the app to remove subscriptions for */
  appId: string;
};

export type DeleteMetaAppSubscriptionOptions = {
  /** Specify the app to remove subscriptions for */
  appId: string;
  /**
   * One or more of the set of valid fields in this object to subscribe to.
   * If not specified, subscriptios of all the fields is removed.
   */
  fields?: string[];
  /**
   * A specific object type to remove subscriptions for. If this optional
   * field is not included, all subscriptions for this app will be removed.
   */
  objectType?: MetaWebhookObjectType;
};
