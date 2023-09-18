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
  MetaApiUploadingFile,
} from '@sociably/meta-api';
import {
  MessageValue,
  SenderActionValue,
  PassThreadControlValue,
  TakeThreadControlValue,
  RequestThreadControlValue,
  MessagingOptions,
} from '@sociably/messenger';
import InstagramChat from './Chat.js';
import InstagramAgent from './Agent.js';
import type { InstagramBot } from './Bot.js';
import { AgentSettingsAccessorI } from './interface.js';
import type { InstagramEvent } from './event/types.js';
import type { INSTAGRAM } from './constant.js';

export * from './event/types.js';

export type InstagramThread = InstagramChat | InstagramAgent;

export type PsidTarget = {
  id: string;
};
export type UserRefTarget = {
  user_ref: string;
};
export type PostPrivateReplyTarget = {
  post_id: string;
};
export type CommentPrivateReplyTarget = {
  comment_id: string;
};

export type MessagingTarget =
  | PsidTarget
  | UserRefTarget
  | PostPrivateReplyTarget
  | CommentPrivateReplyTarget;

// TODO: type the raw event object
export type InstagramRawEvent = any;

export type BaseSegmentValue = {
  type: string;
  apiPath: string;
  params: Record<string, unknown>;
  file?: MetaApiUploadingFile;
  assetTag?: string;
};

export type HandoverProtocolValue =
  | PassThreadControlValue
  | RequestThreadControlValue
  | TakeThreadControlValue;

export type InstagramSegmentValue =
  | MessageValue
  | SenderActionValue
  | HandoverProtocolValue;

export type InstagramComponent<
  Props,
  Segment extends
    IntermediateSegment<InstagramSegmentValue> = IntermediateSegment<InstagramSegmentValue>,
> = NativeComponent<Props, Segment>;

export type RawUserProfile = {
  id: string;
  name?: string;
  username: string;
  profile_pic?: string;
  is_verified_user: boolean;
  follower_count: number;
  is_user_follow_business: boolean;
  is_business_follow_user: boolean;
};

export type InstagramEventContext = {
  platform: typeof INSTAGRAM;
  event: InstagramEvent;
  metadata: WebhookMetadata;
  bot: InstagramBot;
  reply(message: SociablyNode): Promise<null | MetaApiDispatchResponse>;
};

export type InstagramEventMiddleware = EventMiddleware<
  InstagramEventContext,
  null
>;

export type InstagramDispatchFrame = DispatchFrame<InstagramThread, MetaApiJob>;

export type InstagramDispatchMiddleware = DispatchMiddleware<
  MetaApiJob,
  InstagramDispatchFrame,
  MetaApiResult
>;

export type InstagramAgentSettings = {
  /** The Instagram business account ID */
  accountId: string;
  /** The bound Facbebook page ID */
  pageId: string;
  /** The access token of the bound page */
  accessToken: string;
  /** The username of Instagram account */
  username: string;
};

export type InstagramConfigs = {
  /** Instagram integration settings in single agent mode */
  agentSettings?: InstagramAgentSettings;
  /** Instagram integration settings in multi agent mode */
  multiAgentSettings?: InstagramAgentSettings[];
  /** Host integration settings with your own service */
  agentSettingsService?: Interfaceable<AgentSettingsAccessorI>;
  /** The Facebook app ID */
  appId: string;
  /** The Facebook app secret */
  appSecret: string;
  /** The verify token for registering webhook */
  webhookVerifyToken: string;
  /** The webhook path to receive events. Default to `.` */
  webhookPath?: string;
  /** To verify the webhook request by the signature or not. Default to `true` */
  shouldVerifyRequest?: boolean;
  /** To handle the webhook challenge request or not. Default to `true` */
  shouldHandleChallenge?: boolean;
  /**
   * The webhook subscription fields for instagram. Default to `['messages',
   * 'messaging_postbacks', 'messaging_handovers',
   * 'messaging_policy_enforcement', 'messaging_referrals']`
   */
  subscriptionFields?: string[];
  /** The graph API version to make API calls */
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
  eventMiddlewares?: MaybeContainer<InstagramEventMiddleware>[];
  dispatchMiddlewares?: MaybeContainer<InstagramDispatchMiddleware>[];
};

export type InstagramMessagingOptions = Omit<MessagingOptions, 'tag'> & {
  /**
   * Human agent support for issues that cannot be resolved within the 24 hour
   * standard messaging window, such as resolving issues outside normal business
   * hours or issues requiring more than 24 hours to resolve
   */
  tag?: 'HUMAN_AGENT';
};

export type InstagramPlatformUtilities = PlatformUtilities<
  InstagramEventContext,
  null,
  MetaApiJob,
  InstagramDispatchFrame,
  MetaApiResult
>;
