// @flow
import type { MachinatElementProps } from 'types/element';
import type { RenderInnerFn } from 'machinat-renderer/types';

type GeneralRendered = {
  $$entry: string,
};

type MessageRendered = {
  message: Object, // TODO: detailed message type
} & GeneralRendered;

type SenderActionRendered = {
  sender_action: 'mark_seen' | 'typing_on' | 'typing_off',
} & GeneralRendered;

export type ComponentRendered = MessageRendered | SenderActionRendered;

export type MessengerComponent = (
  MachinatElementProps,
  RenderInnerFn
) => ComponentRendered;

export type MessengerJob = {|
  method: string,
  relative_url: string,
  body: string,
  name?: string,
  depends_on?: string,
  attached_files?: string,
  omit_response_on_success?: boolean,
|};

export type MessengerJobResult = {|
  recipient_id: string,
  message_id: string,
  attachment_id: string,
|};

export type Recepient =
  | {| id: string |}
  | {| user_ref: string |}
  | {|
      phone_number: string,
      name?: {| first_name: string, last_name: string |},
    |};

export type ExtenstionContext = {|
  thread_type: string,
  tid: string,
  psid: string,
  signed_request: string,
|};

export type SendOptions = {};
