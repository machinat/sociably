/** @internal */ /** */
import mixin from '@machinat/core/utils/mixin';
import {
  EventBase as Base,
  Message,
  Text,
  QuickReplyPostback,
  NLP,
  Media,
  Sticker,
  Location,
  Fallback,
  Echo,
  Template,
  TemplateProduct,
  Reaction,
  Read,
  Delivery,
  AccountLinking,
  GamePlay,
  PassThreadControl,
  TakeThreadControl,
  RequestThreadControl,
  AppRoles,
  Optin,
  PolicyEnforcement,
  Postback,
  Referral,
} from './mixin';
import type { MessengerRawEvent } from '../types';

const eventFactory = <
  P extends object, // eslint-disable-line @typescript-eslint/ban-types
  T extends string,
  S extends undefined | string
>(
  proto: P,
  type: T,
  subtype: S
) => (
  payload: MessengerRawEvent,
  isStandby = false
): {
  type: T;
  subtype: S;
  payload: MessengerRawEvent;
  isStandby: boolean;
} & P => {
  const event = Object.create(proto);

  event.payload = payload;
  event.type = type;
  event.subtype = subtype;
  event.isStandby = isStandby;

  return event;
};

const TextProto = mixin(Base, Message, Text, Fallback);
export const text = eventFactory(mixin(TextProto, NLP), 'message', 'text');

export const echoText = eventFactory(mixin(TextProto, Echo), 'echo', 'text');

const MediaProto = mixin(Base, Message, Media);
const ImageProto = mixin(MediaProto, Sticker);
export const image = eventFactory(ImageProto, 'message', 'image');
export const video = eventFactory(MediaProto, 'message', 'video');
export const audio = eventFactory(MediaProto, 'message', 'audio');
export const file = eventFactory(MediaProto, 'message', 'file');

const EchoMediaProto = mixin(MediaProto, Echo);
export const echoImage = eventFactory(EchoMediaProto, 'echo', 'image');
export const echoVideo = eventFactory(EchoMediaProto, 'echo', 'video');
export const echoAudio = eventFactory(EchoMediaProto, 'echo', 'audio');
export const echoFile = eventFactory(EchoMediaProto, 'echo', 'file');

const LocationProto = mixin(Base, Message, Location);
export const location = eventFactory(LocationProto, 'message', 'location');

const TemplateProductProto = mixin(Base, Message, Template, TemplateProduct);
export const productTemplate = eventFactory(
  TemplateProductProto,
  'message',
  'product_template'
);

export const echoTemplate = eventFactory(
  mixin(Base, Message, Echo, Template),
  'echo',
  'template'
);

const FallbackProto = mixin(Base, Message, Fallback);
export const fallback = eventFactory(FallbackProto, 'message', 'fallback');
export const echoFallback = eventFactory(
  mixin(FallbackProto, Echo),
  'echo',
  'fallback'
);

export const reaction = eventFactory(
  mixin(Base, Reaction),
  'reaction',
  undefined
);

const QuickReplyPostbackProto = mixin(Base, Message, Text, QuickReplyPostback);
export const quickReplyPostback = eventFactory(
  QuickReplyPostbackProto,
  'postback',
  'quick_reply'
);

const PostbackProto = mixin(Base, Postback);
export const postback = eventFactory(PostbackProto, 'postback', 'button');

export const referral = eventFactory(
  mixin(Base, Referral),
  'referral',
  undefined
);

const ReadProto = mixin(Base, Read);
export const read = eventFactory(ReadProto, 'read', undefined);

const DeliveryProto = mixin(Base, Delivery);
export const delivery = eventFactory(DeliveryProto, 'delivery', undefined);

export const accountLinking = eventFactory(
  mixin(Base, AccountLinking),
  'account_linking',
  undefined
);

export const gamePlay = eventFactory(
  mixin(Base, GamePlay),
  'game_play',
  undefined
);

export const passThreadControl = eventFactory(
  mixin(Base, PassThreadControl),
  'pass_thread_control',
  undefined
);

export const takeThreadControl = eventFactory(
  mixin(Base, TakeThreadControl),
  'take_thread_control',
  undefined
);

export const requestThreadControl = eventFactory(
  mixin(Base, RequestThreadControl),
  'request_thread_control',
  undefined
);

export const appRoles = eventFactory(
  mixin(Base, AppRoles),
  'app_roles',
  undefined
);
export const optin = eventFactory(mixin(Base, Optin), 'optin', undefined);

export const policyEnforcement = eventFactory(
  mixin(Base, PolicyEnforcement),
  'policy_enforcement',
  undefined
);

export const unknown = eventFactory(Base, 'unknown', undefined);
