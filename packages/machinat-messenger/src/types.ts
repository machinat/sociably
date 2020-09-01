/* eslint-disable camelcase */
import type {
  NativeComponent,
  EventContext,
  EventMiddleware,
  DispatchMiddleware,
  PlatformMounter,
} from '@machinat/core/types';
import type { DispatchFrame } from '@machinat/core/engine/types';
import type { ServiceContainer } from '@machinat/core/service/types';
import type { IntermediateSegment } from '@machinat/core/renderer/types';
import type { WebhookMetadata } from '@machinat/http/webhook/types';
import type { MessengerBot } from './bot';
import type MessengerChannel from './channel';
import type MessengerUser from './user';
import type { API_PATH } from './constant';

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

export type MessengerEvent = {
  platform: 'messenger';
  type: string;
  subtype?: string;
  payload: MessengerRawEvent;
};

// TODO: detailed message type
export type MessengerMessage = any;

export type MessageValue = {
  message: MessengerMessage;
  messaging_type?: string;
  notification_type?: string;
  tag?: string;
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

export type BatchAPIRequest = {
  method: string;
  relative_url: string;
  body: null | any;
  name?: string;
  depends_on?: string;
  attached_files?: string;
  omit_response_on_success?: boolean;
};

export type MessengerJob = {
  request: BatchAPIRequest;
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

export type MessengerResult = {
  code: number;
  headers: Record<string, string>;
  body: any;
};

export type GraphAPIErrorInfo = {
  message: string;
  type: string;
  code: number;
  error_subcode: number;
  fbtrace_id: string;
};

export type GraphAPIErrorBody = {
  error: GraphAPIErrorInfo;
};

export type MessengerRawUserProfile = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  profile_pic: string;
  locale?: string;
  timezone?: string;
  gender?: string;
};

export type MessengerEventContext = EventContext<
  MessengerChannel,
  null | MessengerUser,
  MessengerEvent,
  WebhookMetadata,
  MessengerBot
>;

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

export type MessengerPlatformConfigs = {
  pageId: string;
  accessToken: string;
  appSecret?: string;
  shouldValidateRequest?: boolean;
  shouldHandleVerify?: boolean;
  verifyToken?: string;
  consumeInterval?: number;
  webhookPath?: string;
  noServer?: boolean;
  eventMiddlewares?: (
    | MessengerEventMiddleware
    | ServiceContainer<MessengerEventMiddleware>
  )[];
  dispatchMiddlewares?: (
    | MessengerDispatchMiddleware
    | ServiceContainer<MessengerDispatchMiddleware>
  )[];
};

export type MessengerSendOptions = {
  messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  tag?: string;
  notificationType?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH';
  personaId?: string;
};

export type MessengerThreadType = 'USER_TO_PAGE' | 'USER_TO_USER' | 'GROUP';

export type MessengerPlatformMounter = PlatformMounter<
  MessengerEventContext,
  null,
  MessengerJob,
  MessengerDispatchFrame,
  MessengerResult
>;