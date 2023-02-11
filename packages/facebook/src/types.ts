/* eslint-disable camelcase */
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
import type { FacebookBot } from './Bot';
import type FacebookChat from './Chat';
import FacebookInteractTarget from './InteractTarget';
import FacebookPage from './Page';
import type { FacebookEvent } from './event/types';
import type {
  FACEBOOK,
  PATH_MESSAGES,
  PATH_PASS_THREAD_CONTROL,
  PATH_TAKE_THREAD_CONTROL,
  PATH_REQUEST_THREAD_CONTROL,
  PATH_FEED,
  PATH_PHOTOS,
  PATH_VIDEOS,
} from './constant';

export * from './event/types';

export type FacebookChannel =
  | FacebookChat
  | FacebookInteractTarget
  | FacebookPage;

export type PsidTarget = { id: string };
export type UserRefTarget = { user_ref: string };
export type PostPrivateReplyTarget = { post_id: string };
export type CommentPrivateReplyTarget = { comment_id: string };

export type MessagingTarget =
  | PsidTarget
  | UserRefTarget
  | PostPrivateReplyTarget
  | CommentPrivateReplyTarget;

// TODO: type the raw event object
export type FacebookRawEvent = any;

// TODO: detailed message type
export type RawMessage = any;

type MessagingType = 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
type NotificationType = 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH';
type MessageTags =
  | 'CONFIRMED_EVENT_UPDATE'
  | 'POST_PURCHASE_UPDATE'
  | 'ACCOUNT_UPDATE'
  | 'HUMAN_AGENT';

type AttachFileValue = {
  data: string | Buffer | NodeJS.ReadableStream;
  info?: FileInfo;
};

export type MessageValue = {
  type: 'message';
  apiPath: typeof PATH_MESSAGES;
  params: {
    message: RawMessage;
    messaging_type?: MessagingType;
    notification_type?: NotificationType;
    tag?: MessageTags;
    persona_id?: string;
  };
  assetTag?: string;
  attachFile?: AttachFileValue;
};

export type SenderActionValue = {
  type: 'message';
  apiPath: typeof PATH_MESSAGES;
  params: {
    sender_action: 'mark_seen' | 'typing_on' | 'typing_off';
    persona_id?: string;
  };
  assetTag?: undefined;
  attachFile?: undefined;
};

export type PassThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_PASS_THREAD_CONTROL;
  params: {
    target_app_id: number;
    metadata?: string;
  };
  assetTag?: undefined;
  attachFile?: undefined;
};

export type RequestThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_REQUEST_THREAD_CONTROL;
  params: {
    metadata?: string;
  };
  assetTag?: undefined;
  attachFile?: undefined;
};

export type TakeThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_TAKE_THREAD_CONTROL;
  params: {
    metadata?: string;
  };
  assetTag?: undefined;
  attachFile?: undefined;
};

export type CommentValue = {
  type: 'comment';
  params: Record<string, unknown>;
  assetTag?: undefined;
  attachFile?: undefined;
  photo?: PagePhotoValue;
};

export type PagePhotoValue = {
  type: 'page';
  apiPath: typeof PATH_PHOTOS;
  params: Record<string, unknown>;
  assetTag?: string;
  attachFile?: AttachFileValue;
};

export type PageVideoValue = {
  type: 'page';
  apiPath: typeof PATH_VIDEOS;
  params: Record<string, unknown>;
  assetTag?: string;
  attachFile?: AttachFileValue;
  thumbnailFile?: AttachFileValue;
};

export type PagePostValue = {
  type: 'page';
  apiPath: typeof PATH_FEED;
  params: Record<string, unknown>;
  assetTag?: string;
  attachFile?: AttachFileValue;
  photos?: PagePhotoValue[];
};

export type HandoverProtocolValue =
  | PassThreadControlValue
  | RequestThreadControlValue
  | TakeThreadControlValue;

export type FacebookSegmentValue =
  | MessageValue
  | SenderActionValue
  | HandoverProtocolValue
  | PagePostValue
  | PagePhotoValue
  | PageVideoValue
  | CommentValue;

export type FacebookComponent<
  Props,
  Segment extends IntermediateSegment<FacebookSegmentValue> = IntermediateSegment<FacebookSegmentValue>
> = NativeComponent<Props, Segment>;

export type RawUserProfile = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  profile_pic: string;
  locale?: string;
  timezone?: number;
  gender?: string;
};

export type FacebookEventContext = {
  platform: typeof FACEBOOK;
  event: FacebookEvent;
  metadata: WebhookMetadata;
  bot: FacebookBot;
  reply(message: SociablyNode): Promise<null | MetaApiDispatchResponse>;
};

export type FacebookEventMiddleware = EventMiddleware<
  FacebookEventContext,
  null
>;

export type FacebookDispatchFrame = DispatchFrame<FacebookChannel, MetaApiJob>;

export type FacebookDispatchMiddleware = DispatchMiddleware<
  MetaApiJob,
  FacebookDispatchFrame,
  MetaApiResult
>;

export type FacebookConfigs = {
  /** The Facebook page id */
  pageId: string;
  /** The page access token for the app */
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
  /** Request additional info of user profile. This requires addtional permisions of your app */
  optionalProfileFields?: ('locale' | 'timezone' | 'gender')[];
  apiBatchRequestInterval?: number;
  eventMiddlewares?: MaybeContainer<FacebookEventMiddleware>[];
  dispatchMiddlewares?: MaybeContainer<FacebookDispatchMiddleware>[];
};

export type MessagingOptions = {
  messagingType?: MessagingType;
  tag?: string;
  notificationType?: NotificationType;
  personaId?: string;
  oneTimeNotifToken?: string;
};

export type FacebookPlatformUtilities = PlatformUtilities<
  FacebookEventContext,
  null,
  MetaApiJob,
  FacebookDispatchFrame,
  MetaApiResult
>;
