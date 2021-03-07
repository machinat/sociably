/* eslint-disable camelcase */
import type {
  NativeComponent,
  EventMiddleware,
  DispatchMiddleware,
  PlatformMounter,
} from '@machinat/core/types';
import type { DispatchFrame } from '@machinat/core/engine/types';
import type { MaybeContainer } from '@machinat/core/service/types';
import type { IntermediateSegment } from '@machinat/core/renderer/types';
import type { WebhookMetadata } from '@machinat/http/webhook/types';
import type { MessengerBot } from './bot';
import type MessengerChannel from './channel';
import type { MessengerEvent } from './event/types';
import type { API_PATH } from './constant';

export { MessengerEvent } from './event/types';
export { default as MessengerChat } from './channel';
export { default as MessengerUser } from './user';

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
};

export type SenderActionValue = {
  sender_action: 'mark_seen' | 'typing_on' | 'typing_off'; // eslint-disable-line camelcase
};

export type PassThreadControlValue = {
  target_app_id: string; // eslint-disable-line camelcase
  metadata: string;
  [API_PATH]: any;
};

export type RequestThreadControlValue = {
  metadata: string;
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
  Segment extends IntermediateSegment<
    MessengerSegmentValue
  > = IntermediateSegment<MessengerSegmentValue>
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
  channelUId?: string;
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
  timezone?: string;
  gender?: string;
};

export type MessengerEventContext = {
  platform: 'messenger';
  event: MessengerEvent;
  metadata: WebhookMetadata;
  bot: MessengerBot;
};

export type MessengerEventMiddleware = EventMiddleware<
  MessengerEventContext,
  null
>;

export type MessengerDispatchFrame = DispatchFrame<
  MessengerChannel,
  MessengerJob,
  MessengerBot
>;

export type MessengerDispatchMiddleware = DispatchMiddleware<
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult
>;

export type MessengerConfigs = {
  pageId: string;
  accessToken: string;
  appSecret?: string;
  shouldValidateRequest?: boolean;
  shouldHandleVerify?: boolean;
  verifyToken?: string;
  consumeInterval?: number;
  entryPath?: string;
  noServer?: boolean;
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

export type MessengerPlatformMounter = PlatformMounter<
  MessengerEventContext,
  null,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult
>;
