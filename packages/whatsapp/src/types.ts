import type {
  NativeComponent,
  EventMiddleware,
  DispatchMiddleware,
  PlatformUtilities,
  SociablyNode,
} from '@sociably/core';
import type { DispatchFrame } from '@sociably/core/engine';
import type { MaybeContainer } from '@sociably/core/service';
import type { IntermediateSegment } from '@sociably/core/renderer';
import type { WebhookMetadata } from '@sociably/http/webhook';
import type {
  MetaApiJob,
  MetaApiResult,
  MetaApiDispatchResponse,
  FileInfo,
} from '@sociably/meta-api';
import type { WhatsAppBot } from './Bot';
import type WhatsAppChat from './Chat';
import type { WhatsAppEvent } from './event/types';

export * from './event/types';

export type WhatsAppSegmentValue = {
  message: Omit<CreateMessageData, 'to' | 'messaging_product'>;
  mediaFile?: {
    type: string;
    data: string | Buffer | NodeJS.ReadableStream;
    info?: FileInfo;
    assetTag?: string;
  };
};

export type WhatsAppComponent<
  Props,
  Segment extends IntermediateSegment<WhatsAppSegmentValue> = IntermediateSegment<WhatsAppSegmentValue>
> = NativeComponent<Props, Segment>;

export type WhatsAppEventContext = {
  platform: 'whatsapp';
  event: WhatsAppEvent;
  metadata: WebhookMetadata;
  bot: WhatsAppBot;
  reply(message: SociablyNode): Promise<null | MetaApiDispatchResponse>;
};

export type WhatsAppEventMiddleware = EventMiddleware<
  WhatsAppEventContext,
  null
>;

export type WhatsAppDispatchFrame = DispatchFrame<WhatsAppChat, MetaApiJob>;

export type WhatsAppDispatchMiddleware = DispatchMiddleware<
  MetaApiJob,
  WhatsAppDispatchFrame,
  MetaApiResult
>;

export type WhatsAppConfigs = {
  /** WhatsApp business account id */
  businessId: string;
  /** Business phone number for the bot */
  businessNumber: string;
  /** The access token for the app */
  accessToken: string;
  /** The Facebook app secret */
  appSecret?: string;
  /** To verify the webhook request by the signature or not. Default to `true` */
  shouldVerifyRequest?: boolean;
  /** To handle the webhook challenge request or not. Default to `true` */
  shouldHandleChallenge?: boolean;
  /** The secret string to verify the webhook challenge request */
  verifyToken?: string;
  /** The webhook path to receive events. Default to `/` */
  webhookPath?: string;
  /** The graph API version to make API calls */
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
  eventMiddlewares?: MaybeContainer<WhatsAppEventMiddleware>[];
  dispatchMiddlewares?: MaybeContainer<WhatsAppDispatchMiddleware>[];
};

export type WhatsAppPlatformUtilities = PlatformUtilities<
  WhatsAppEventContext,
  null,
  MetaApiJob,
  WhatsAppDispatchFrame,
  MetaApiResult
>;

/* eslint-disable camelcase */

export type UserProfileData = { name: string };

export type ContactData = {
  wa_id: string;
  profile: UserProfileData;
};

// TODO: type the raw event object
export type WhatsAppEventData = any;

// TODO: detailed message type
export type MessageData = any;

export type CreateMessageData = {
  audio?: unknown;
  contacts?: unknown;
  document?: unknown;
  image?: unknown;
  interactive?: unknown;
  location?: unknown;
  messaging_product: 'whatsapp';
  status?: unknown;
  sticker?: unknown;
  template?: unknown;
  text?: unknown;
  to: string;
  type?: string;
};
