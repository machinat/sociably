// @flow
import type { MachinatNativeComponent } from 'machinat/types';
import type { BotPlugin, MachinatEvent } from 'machinat-base/types';
import type MachinatQueue from 'machinat-queue';
import type { WebhookMetadata } from 'machinat-webhook-receiver/types';
import type MessengerChannel from './channel';
import typeof { ENTRY_PATH } from './constant';

type PSIDSource = {| id: string |};
type UserRefSource = {| user_ref: string |};
type PhoneNumberSource = {|
  phone_number: string,
  name?: {| first_name: string, last_name: string |},
|};

export type MessengerSource = PSIDSource | UserRefSource | PhoneNumberSource;

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
export type MessengerMessage = {};

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
  [ENTRY_PATH]: string,
|};

type RequestThreadControlValue = {|
  metadata: string,
  [ENTRY_PATH]: string,
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
  body: Object,
  name?: string,
  depends_on?: string,
  attached_files?: string,
  omit_response_on_success?: boolean,
|};

export type MessengerJob = {|
  request: MessengerRequest,
  channelUid?: string,
  attachedFileData?: string | Buffer | ReadableStream,
  attachedFileInfo?: {|
    filename?: string,
    filepath?: string,
    contentType?: string,
    knownLength?: number,
  |},
|};

export type MessengerAPIResult = {|
  code: number,
  headers: Object,
  // TODO: type the api result
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

export type BroadcastOptions = {|
  notificationType?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH',
  personaId?: string,
  customLabelId?: number,
|};

export type MessengerQueue = MachinatQueue<MessengerJob, MessengerAPIResult>;

export type MessengerBotOptions = {
  accessToken: string,
  appSecret?: string,
  shouldValidateRequest: boolean,
  shouldVerifyWebhook: boolean,
  verifyToken?: string,
  respondTimeout: number,
  consumeInterval?: number,
  plugins?: BotPlugin<
    MessengerChannel,
    MessengerEvent,
    WebhookMetadata,
    MessengerResponse,
    MessengerSegmentValue,
    MessengerComponent,
    MessengerJob,
    MessengerAPIResult
  >[],
};
