// @flow
import { mixin } from 'machinat-utility';
import type { MachinatEvent } from 'machinat-base/types';
import {
  EventBase as Base,
  Message,
  Text,
  NLP,
  Media,
  Location,
  Echo,
  Template,
  Read,
  Delivery,
  AccountLinking,
  CheckoutUpdate,
  GamePlay,
  PassThreadControl,
  TakeThreadControl,
  RequestThreadControl,
  AppRoles,
  Optin,
  Payment,
  PolicyEnforcement,
  Postback,
  PaymentPreCheckout,
  Referral,
} from './mixin';
import type { MessengerRawEvent } from '../types';
import type { ChatThread } from '../thread';

export const eventFactory = (proto: Object, type: string, subtype?: string) => (
  raw: MessengerRawEvent
): MachinatEvent<MessengerRawEvent, ChatThread> => {
  const event = Object.create(proto);

  event.raw = raw;
  event.type = type;
  event.subtype = subtype;

  return event;
};

const TextProto = mixin(Base, Message, Text, NLP);
export const text = eventFactory(TextProto, 'text');
export const standbyText = eventFactory(TextProto, 'standby', 'text');

const MediaProto = mixin(Base, Message, Media);
export const image = eventFactory(MediaProto, 'image');
export const video = eventFactory(MediaProto, 'video');
export const audio = eventFactory(MediaProto, 'audio');
export const file = eventFactory(MediaProto, 'file');

export const standbyImage = eventFactory(MediaProto, 'standby', 'image');
export const standbyVideo = eventFactory(MediaProto, 'standby', 'video');
export const standbyAudio = eventFactory(MediaProto, 'standby', 'audio');
export const standbyFile = eventFactory(MediaProto, 'standby', 'file');

const LocationProto = mixin(Base, Message, Location);
export const location = eventFactory(LocationProto, 'location');
export const standbyLocation = eventFactory(
  LocationProto,
  'standby',
  'location'
);

export const echoedText = eventFactory(
  mixin(Base, Message, Echo, Text),
  'echo',
  'text'
);

const EchoedMediaProto = mixin(Base, Message, Echo, Media);
export const echoedImage = eventFactory(EchoedMediaProto, 'echo', 'image');
export const echoedVideo = eventFactory(EchoedMediaProto, 'echo', 'video');
export const echoedAudio = eventFactory(EchoedMediaProto, 'echo', 'audio');
export const echoedFile = eventFactory(EchoedMediaProto, 'echo', 'file');

export const echoedLocation = eventFactory(
  mixin(Base, Message, Echo, Location),
  'echo',
  'location'
);
export const echoedTemplate = eventFactory(
  mixin(Base, Message, Echo, Template),
  'echo',
  'template'
);

const ReadProto = mixin(Base, Read);
export const read = eventFactory(ReadProto, 'read');
export const standbyRead = eventFactory(ReadProto, 'standby', 'read');

const DeliveryProto = mixin(Base, Delivery);
export const delivery = eventFactory(DeliveryProto, 'delivery');
export const standbyDelivery = eventFactory(
  DeliveryProto,
  'standby',
  'delivery'
);

export const accountLinking = eventFactory(
  mixin(Base, AccountLinking),
  'account_linking'
);
export const checkoutUpdate = eventFactory(
  mixin(Base, CheckoutUpdate),
  'checkout_update'
);
export const gamePlay = eventFactory(mixin(Base, GamePlay), 'game_play');
export const passThreadControl = eventFactory(
  mixin(Base, PassThreadControl),
  'pass_thread_control'
);
export const takeThreadControl = eventFactory(
  mixin(Base, TakeThreadControl),
  'take_thread_control'
);
export const requestThreadControl = eventFactory(
  mixin(Base, RequestThreadControl),
  'request_thread_control'
);
export const appRoles = eventFactory(mixin(Base, AppRoles), 'app_roles');
export const optin = eventFactory(mixin(Base, Optin), 'optin');
export const payment = eventFactory(mixin(Base, Payment), 'payment');
export const policyEnforcement = eventFactory(
  mixin(Base, PolicyEnforcement),
  'policy_enforcement'
);

const PostbackProto = mixin(Base, Postback);
export const postback = eventFactory(PostbackProto, 'postback');
export const standbyPostback = eventFactory(
  PostbackProto,
  'standby',
  'postback'
);

export const paymentPreCheckout = eventFactory(
  mixin(Base, PaymentPreCheckout),
  'payment_pre_checkout'
);
export const referral = eventFactory(mixin(Base, Referral), 'referral');

export const unknown = eventFactory(mixin(Base), 'unknown');
