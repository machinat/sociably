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
import type { MessengerBot } from './Bot';
import type MessengerChat from './Chat';
import type SendTarget from './SendTarget';
import type { MessengerEvent } from './event/types';
import type { API_PATH, ATTACHMENT_DATA, ATTACHMENT_INFO } from './constant';

export * from './event/types';

export type MessengerChannel = MessengerChat | SendTarget;

export type PSIDTarget = { id: string };
export type UserRefTarget = { user_ref: string };
export type PostPrivateReplyTarget = { post_id: string };
export type CommentPrivateReplyTarget = { comment_id: string };

export type MessengerTarget =
  | PSIDTarget
  | UserRefTarget
  | PostPrivateReplyTarget
  | CommentPrivateReplyTarget;

// TODO: type the raw event object
export type MessengerRawEvent = any;

// TODO: detailed message type
export type RawMessage = any;

type MessagingType = 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
type NotificationType = 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH';
type MessageTags =
  | 'CONFIRMED_EVENT_UPDATE'
  | 'POST_PURCHASE_UPDATE'
  | 'ACCOUNT_UPDATE'
  | 'HUMAN_AGENT';

export type MessageValue = {
  message: RawMessage;
  messaging_type?: MessagingType;
  notification_type?: NotificationType;
  tag?: MessageTags;
  persona_id?: string;
  [ATTACHMENT_DATA]?: string | Buffer | NodeJS.ReadableStream;
  [ATTACHMENT_INFO]?: FileInfo;
};

export type SenderActionValue = {
  sender_action: 'mark_seen' | 'typing_on' | 'typing_off'; // eslint-disable-line camelcase
};

export type PassThreadControlValue = {
  target_app_id: number; // eslint-disable-line camelcase
  metadata?: string;
  [API_PATH]: string;
};

export type RequestThreadControlValue = {
  metadata?: string;
  [API_PATH]: string;
};

export type TakeThreadControlValue = RequestThreadControlValue;

export type HandoverProtocolValue =
  | PassThreadControlValue
  | RequestThreadControlValue
  | TakeThreadControlValue;

export type MessengerSegmentValue =
  | MessageValue
  | SenderActionValue
  | HandoverProtocolValue;

export type MessengerComponent<
  Props,
  Segment extends IntermediateSegment<MessengerSegmentValue> = IntermediateSegment<MessengerSegmentValue>
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

export type MessengerEventContext = {
  platform: 'messenger';
  event: MessengerEvent;
  metadata: WebhookMetadata;
  bot: MessengerBot;
  reply(message: SociablyNode): Promise<null | MetaApiDispatchResponse>;
};

export type MessengerEventMiddleware = EventMiddleware<
  MessengerEventContext,
  null
>;

export type MessengerDispatchFrame = DispatchFrame<
  MessengerChannel,
  MetaApiJob
>;

export type MessengerDispatchMiddleware = DispatchMiddleware<
  MetaApiJob,
  MessengerDispatchFrame,
  MetaApiResult
>;

export type MessengerConfigs = {
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
  eventMiddlewares?: MaybeContainer<MessengerEventMiddleware>[];
  dispatchMiddlewares?: MaybeContainer<MessengerDispatchMiddleware>[];
};

export type MessengerSendOptions = {
  messagingType?: MessagingType;
  tag?: string;
  notificationType?: NotificationType;
  personaId?: string;
  oneTimeNotifToken?: string;
};

export type MessengerPlatformUtilities = PlatformUtilities<
  MessengerEventContext,
  null,
  MetaApiJob,
  MessengerDispatchFrame,
  MetaApiResult
>;
