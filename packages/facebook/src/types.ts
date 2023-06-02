/* eslint-disable camelcase */
import type {
  NativeComponent,
  EventMiddleware,
  DispatchMiddleware,
  PlatformUtilities,
  SociablyNode,
} from '@sociably/core';
import type { DispatchFrame } from '@sociably/core/engine';
import type { MaybeContainer, Interfaceable } from '@sociably/core/service';
import type { IntermediateSegment } from '@sociably/core/renderer';
import type { WebhookMetadata } from '@sociably/http/webhook';
import type {
  MetaApiJob,
  MetaApiResult,
  MetaApiDispatchResponse,
  FileInfo,
} from '@sociably/meta-api';
import type { FacebookBot } from './Bot.js';
import type FacebookChat from './Chat.js';
import FacebookInteractTarget from './InteractTarget.js';
import { AgentSettingsAccessorI } from './interface.js';
import type { FacebookEvent } from './event/types.js';
import type {
  FACEBOOK,
  PATH_MESSAGES,
  PATH_PASS_THREAD_CONTROL,
  PATH_TAKE_THREAD_CONTROL,
  PATH_REQUEST_THREAD_CONTROL,
  PATH_FEED,
  PATH_PHOTOS,
  PATH_VIDEOS,
} from './constant.js';

export * from './event/types.js';

export type FacebookThread = FacebookChat | FacebookInteractTarget;

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

export type AttachFileValue = {
  data: string | Buffer | NodeJS.ReadableStream;
  info?: FileInfo;
};

export type BaseSegmentValue = {
  type: string;
  apiPath: string;
  params: Record<string, unknown>;
  attachFile?: AttachFileValue;
  assetTag?: string;
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
  attachFile?: AttachFileValue;
  assetTag?: string;
};

export type SenderActionValue = {
  type: 'message';
  apiPath: typeof PATH_MESSAGES;
  params: {
    sender_action: 'mark_seen' | 'typing_on' | 'typing_off';
    persona_id?: string;
  };
  attachFile?: undefined;
};

export type PassThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_PASS_THREAD_CONTROL;
  params: {
    target_app_id: number;
    metadata?: string;
  };
  attachFile?: undefined;
};

export type RequestThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_REQUEST_THREAD_CONTROL;
  params: {
    metadata?: string;
  };
  attachFile?: undefined;
};

export type TakeThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_TAKE_THREAD_CONTROL;
  params: {
    metadata?: string;
  };
  attachFile?: undefined;
};

export type CommentValue = {
  type: 'comment';
  params: Record<string, unknown>;
  attachFile?: undefined;
  photo?: PagePhotoValue;
};

export type PagePhotoValue = {
  type: 'page';
  apiPath: typeof PATH_PHOTOS;
  params: Record<string, unknown>;
  attachFile?: AttachFileValue;
};

export type PageVideoValue = {
  type: 'page';
  apiPath: typeof PATH_VIDEOS;
  params: Record<string, unknown>;
  attachFile?: AttachFileValue;
  thumbnailFile?: AttachFileValue;
};

export type PagePostValue = {
  type: 'page';
  apiPath: typeof PATH_FEED;
  params: Record<string, unknown>;
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

export type FacebookDispatchFrame = DispatchFrame<FacebookThread, MetaApiJob>;

export type FacebookDispatchMiddleware = DispatchMiddleware<
  MetaApiJob,
  FacebookDispatchFrame,
  MetaApiResult
>;

export type FacebookPageSettings = {
  /** The Facebook page id */
  pageId: string;
  /** The page access token for the app */
  accessToken: string;
};

export type FacebookConfigs = {
  /** Page integration settings in single page mode */
  agentSettings?: FacebookPageSettings;
  /** Page integration settings in multi page mode */
  multiAgentSettings?: FacebookPageSettings[];
  /** Host page integration settings with your own service */
  agentSettingsService?: Interfaceable<AgentSettingsAccessorI>;
  /** The Facebook app ID */
  appId: string;
  /** The Facebook app secret */
  appSecret: string;
  /** To verify the webhook request by the signature or not. Default to `true` */
  shouldVerifyRequest?: boolean;
  /** To handle the webhook challenge request or not. Default to `true` */
  shouldHandleChallenge?: boolean;
  /** The secret string to verify the webhook challenge request */
  verifyToken: string;
  /** The webhook path to receive events. Default to `/` */
  webhookPath?: string;
  /**
   * The webhook subscription fields. Default to `['messages', 'messaging_postbacks', 'messaging_optins',
   * 'messaging_handovers', 'messaging_policy_enforcement', 'messaging_account_linking', 'messaging_game_plays',
   * 'messaging_referrals']`
   * */
  webhookSubscriptionFields?: string[];
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
