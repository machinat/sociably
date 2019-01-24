// @flow
import type {
  ContainerNativeType,
  ValuesNativeType,
} from 'machinat-renderer/types';

export type MessengerBotOptions = {
  accessToken: string,
  appSecret?: string,
  shouldValidateRequest: boolean,
  shouldVerifyWebhook: boolean,
  verifyToken?: string,
  respondTimeout: number,
  consumeInterval: number,
};

type MessageActionValue = {
  message: Object, // TODO: detailed message type
};

type SenderActionValue = {
  sender_action: 'mark_seen' | 'typing_on' | 'typing_off',
};

export type MessengerActionValue = MessageActionValue | SenderActionValue;

export type MessengerContainerComponent = ContainerNativeType<MessengerActionValue> & {
  $$entry?: string,
};

export type MessengerValuesComponent = ValuesNativeType<MessengerActionValue> & {
  $$entry?: string,
};

export type MessengerComponent =
  | MessengerContainerComponent
  | MessengerValuesComponent;

export type MessengerRequest = {|
  method: string,
  relative_url: string,
  body: string,
  name: ?string,
  depends_on: ?string,
  attached_files: ?string,
  omit_response_on_success: ?boolean,
|};

export type MessengerJob = {|
  request: MessengerRequest,
  threadId: string,
  attachedFileData: void | string | Buffer | ReadableStream,
  attachedFileInfo: void | {|
    filename?: string,
    filepath?: string,
    contentType?: string,
    knownLength?: number,
  |},
|};

export type MessengerJobResult = {|
  recipient_id: string,
  message_id: string,
  attachment_id: string,
|};

type PSIDRecepient = {| id: string |};
type UserRefRecepient = {| user_ref: string |};
type PhoneNumberRecepient = {|
  phone_number: string,
  name?: {| first_name: string, last_name: string |},
|};

export type Recepient = PSIDRecepient | UserRefRecepient | PhoneNumberRecepient;

export type ExtenstionContext = {|
  thread_type: string,
  tid: string,
  psid: string,
  signed_request: string,
|};

export type MessengerSendOptions = {
  messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG',
  tag?: string,
  notificationType?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH',
  personaId?: string,
};
