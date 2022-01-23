/* eslint-disable camelcase */
import type {
  NativeComponent,
  EventMiddleware,
  DispatchMiddleware,
  PlatformUtilities,
  MachinatNode,
} from '@machinat/core';
import type { DispatchFrame, DispatchResponse } from '@machinat/core/engine';
import type { MaybeContainer } from '@machinat/core/service';
import type { IntermediateSegment } from '@machinat/core/renderer';
import type { WebhookMetadata } from '@machinat/http/webhook';
import type { MessengerBot } from './Bot';
import type MessengerChannel from './Chat';
import type { MessengerEvent } from './event/types';
import type { API_PATH, ATTACHMENT_DATA, ATTACHMENT_INFO } from './constant';

export * from './event/types';

export type PSIDTarget = { id: string };
export type UserRefTarget = { user_ref: string };
export type PhoneNumberTarget = {
  phone_number: string;
  name?: { first_name: string; last_name: string };
};
export type PostPrivateReplyTarget = { post_id: string };
export type CommentPrivateReplyTarget = { comment_id: string };

export type MessengerTarget =
  | PSIDTarget
  | UserRefTarget
  | PhoneNumberTarget
  | PostPrivateReplyTarget
  | CommentPrivateReplyTarget;

// TODO: type the raw event object
export type MessengerRawEvent = any;

// TODO: detailed message type
export type RawMessage = any;

export type MessengerThreadType = 'USER_TO_PAGE' | 'USER_TO_USER' | 'GROUP';

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
  [ATTACHMENT_DATA]?: string | Buffer | ReadableStream;
  [ATTACHMENT_INFO]?: Record<string, string | number>;
};

export type SenderActionValue = {
  sender_action: 'mark_seen' | 'typing_on' | 'typing_off'; // eslint-disable-line camelcase
};

export type PassThreadControlValue = {
  target_app_id: number; // eslint-disable-line camelcase
  metadata?: string;
  [API_PATH]: any;
};

export type RequestThreadControlValue = {
  metadata?: string;
  [API_PATH]: any;
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

export type BatchApiRequest = {
  method: string;
  relative_url: string;
  body: null | any;
  name?: string;
  depends_on?: string;
  attached_files?: string;
  omit_response_on_success?: boolean;
};

export type MessengerJob = {
  request: BatchApiRequest;
  pageId?: string;
  channelUid?: string;
  attachmentAssetTag?: string;
  attachmentFileData?: string | Buffer | ReadableStream;
  attachmentFileInfo?: {
    filename?: string;
    filepath?: string;
    contentType?: string;
    knownLength?: number;
  };
};

export type FbGraphApiResult = Record<string, any>;

export type MessengerResult = {
  code: number;
  headers: Record<string, string>;
  body: FbGraphApiResult;
};

export type GraphApiErrorInfo = {
  message: string;
  type: string;
  code: number;
  error_subcode: number;
  fbtrace_id: string;
};

export type GraphApiErrorBody = {
  error: GraphApiErrorInfo;
};

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

export type MessengerDispatchResponse = DispatchResponse<
  MessengerJob,
  MessengerResult
>;

export type MessengerEventContext = {
  platform: 'messenger';
  event: MessengerEvent;
  metadata: WebhookMetadata;
  bot: MessengerBot;
  reply(message: MachinatNode): Promise<null | MessengerDispatchResponse>;
};

export type MessengerEventMiddleware = EventMiddleware<
  MessengerEventContext,
  null
>;

export type MessengerDispatchFrame = DispatchFrame<
  MessengerChannel,
  MessengerJob
>;

export type MessengerDispatchMiddleware = DispatchMiddleware<
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult
>;

export type MessengerConfigs = {
  pageId: number;
  accessToken: string;
  appSecret?: string;
  shouldValidateRequest?: boolean;
  shouldHandleVerify?: boolean;
  verifyToken?: string;
  webhookPath?: string;
  graphApiVersion?: string;
  consumeInterval?: number;
  optionalProfileFields?: ('locale' | 'timezone' | 'gender')[];
  eventMiddlewares?: MaybeContainer<MessengerEventMiddleware>[];
  dispatchMiddlewares?: MaybeContainer<MessengerDispatchMiddleware>[];
};

export type MessengerSendOptions = {
  messagingType?: MessagingType;
  tag?: string;
  notificationType?: NotificationType;
  personaId?: string;
};

export type MessengerPlatformUtilities = PlatformUtilities<
  MessengerEventContext,
  null,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult
>;
