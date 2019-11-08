// @flow
import type { MachinatNativeComponent, MachinatEvent } from 'machinat/types';
import type {
  BotPlugin,
  EventMiddleware,
  DispatchMiddleware,
} from 'machinat-base/types';
import type MachinatQueue from 'machinat-queue';
import type { WebhookMetadata } from 'machinat-webhook-receiver/types';
import type MessengerBot from './bot';
import type MessengerChannel from './channel';
import type { MessengerUser } from './user';
import typeof { ENTRY_PATH } from './constant';

export type PSIDTarget = {| id: string |};
export type UserRefTarget = {| user_ref: string |};
export type PhoneNumberTarget = {|
  phone_number: string,
  name?: {| first_name: string, last_name: string |},
|};
export type PostPrivateReplyTarget = {| post_id: string |};
export type CommentPrivateReplyTarget = {| comment_id: string |};

export type MessengerTarget =
  | PSIDTarget
  | UserRefTarget
  | PhoneNumberTarget
  | PostPrivateReplyTarget
  | CommentPrivateReplyTarget;

// TODO: type the raw event object
export type MessengerRawEvent = Object;

export type MessengerEvent = {|
  platform: 'messenger',
  type: string,
  subtype?: string,
  payload: MessengerRawEvent,
|};

declare var e: MessengerEvent;
(e: MachinatEvent<MessengerRawEvent>);

// TODO: detailed message type
export type MessengerMessage = Object;

type PreChackoutResponse = Object;
type CheckoutUpdateResponse = Object;
export type MessengerResponse =
  | void
  | PreChackoutResponse
  | CheckoutUpdateResponse;

type MessageValue = {|
  message: MessengerMessage,
  messaging_type?: string,
  notification_type?: string,
  tag?: string,
  persona_id?: string,
|};

type SenderActionValue = {|
  sender_action: 'mark_seen' | 'typing_on' | 'typing_off',
|};

type PassThreadControlValue = {|
  target_app_id: string,
  metadata: string,
  [ENTRY_PATH]: any,
|};

type RequestThreadControlValue = {|
  metadata: string,
  [ENTRY_PATH]: any,
|};

type TakeThreadControlValue = RequestThreadControlValue;

export type MessengerSegmentValue =
  | MessageValue
  | SenderActionValue
  | PassThreadControlValue
  | RequestThreadControlValue
  | TakeThreadControlValue;

export type MessengerComponent = MachinatNativeComponent<MessengerSegmentValue>;

export type MessengerRequest = {|
  method: string,
  relative_url: string,
  body: void | Object,
  name?: string,
  depends_on?: string,
  attached_files?: string,
  omit_response_on_success?: boolean,
|};

export type MessengerJob = {|
  request: MessengerRequest,
  pageId?: string,
  channelUid?: string,
  attachmentAssetTag?: string,
  attachmentFileData?: string | Buffer | ReadableStream,
  attachmentFileInfo?: {|
    filename?: string,
    filepath?: string,
    contentType?: string,
    knownLength?: number,
  |},
|};

export type MessengerAPIResult = {|
  code: number,
  headers: Object,
  body: Object,
|};

export type GraphAPIErrorInfo = {
  message: string,
  type: string,
  code: number,
  error_subcode: number,
  fbtrace_id: string,
};

export type GraphAPIErrorBody = {
  error: GraphAPIErrorInfo,
};

export type MessengerSendOptions = {|
  messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG',
  tag?: string,
  notificationType?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH',
  personaId?: string,
|};

export type MessengerQueue = MachinatQueue<MessengerJob, MessengerAPIResult>;

export type MessengerBotPlugin = BotPlugin<
  MessengerChannel,
  ?MessengerUser,
  MessengerEvent,
  WebhookMetadata,
  MessengerResponse,
  MessengerSegmentValue,
  MessengerComponent,
  MessengerJob,
  MessengerAPIResult,
  MessengerSendOptions,
  MessengerBot
>;

export type MessengerBotOptions = {
  pageId: string,
  accessToken: string,
  appSecret?: string,
  shouldValidateRequest: boolean,
  shouldVerifyWebhook: boolean,
  verifyToken?: string,
  respondTimeout: number,
  consumeInterval?: number,
  plugins?: MessengerBotPlugin[],
};

export type MessengerEventMiddleware = EventMiddleware<
  MessengerChannel,
  ?MessengerUser,
  MessengerEvent,
  WebhookMetadata,
  MessengerResponse,
  MessengerComponent,
  MessengerSendOptions
>;

export type MessengerDispatchMiddleware = DispatchMiddleware<
  MessengerChannel,
  MessengerJob,
  MessengerAPIResult
>;

export type MessengerThreadType = 'USER_TO_PAGE' | 'USER_TO_USER' | 'GROUP';

export type ExtensionContext = {
  thread_type: MessengerThreadType,
  tid: string,
  psid: string,
  signed_request: string,
};

export type ExtensionContextPayload = {
  psid: string,
  algorithm: string,
  thread_type: MessengerThreadType,
  tid: string,
  issued_at: number,
  page_id: number,
};
