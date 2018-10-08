import { mixin, makeEvent } from 'machinat-shared';
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
} from './descriptor';

const textProto = mixin(Base, Message, Text, NLP);
export const text = makeEvent('text', null, textProto);
export const standbyText = makeEvent('standby:text', textProto);

const MediaProto = mixin(Base, Message, Media);
export const image = makeEvent('image', null, MediaProto);
export const video = makeEvent('video', null, MediaProto);
export const audio = makeEvent('audio', null, MediaProto);
export const file = makeEvent('file', null, MediaProto);

export const standbyImage = makeEvent('standby', 'image', MediaProto);
export const standbyVideo = makeEvent('standby', 'video', MediaProto);
export const standbyAudio = makeEvent('standby', 'audio', MediaProto);
export const standbyFile = makeEvent('standby', 'file', MediaProto);

const LocationProto = mixin(Base, Message, Location);
export const location = makeEvent('location', null, LocationProto);
export const standbyLocation = makeEvent('standby', 'location', LocationProto);

export const echoedText = makeEvent(
  'echo',
  'text',
  mixin(Base, Message, Echo, Text)
);

const EchoedMediaProto = mixin(Base, Message, Echo, Media);
export const echoedImage = makeEvent('echo', 'image', EchoedMediaProto);
export const echoedVideo = makeEvent('echo', 'video', EchoedMediaProto);
export const echoedAudio = makeEvent('echo', 'audio', EchoedMediaProto);
export const echoedFile = makeEvent('echo', 'file', EchoedMediaProto);

export const echoedLocation = makeEvent(
  'echo',
  'location',
  mixin(Base, Message, Echo, Location)
);
export const echoedTemplate = makeEvent(
  'echo',
  'template',
  mixin(Base, Message, Echo, Template)
);

const ReadProto = mixin(Base, Read);
export const read = makeEvent('read', null, ReadProto);
export const standbyRead = makeEvent('standby', 'read', ReadProto);

const DeliveryProto = mixin(Base, Delivery);
export const delivery = makeEvent('delivery', null, DeliveryProto);
export const standbyDelivery = makeEvent('standby', 'delivery', DeliveryProto);

export const accountLinking = makeEvent(
  'account_linking',
  null,
  mixin(Base, AccountLinking)
);
export const checkoutUpdate = makeEvent(
  'checkout_update',
  null,
  mixin(Base, CheckoutUpdate)
);
export const gamePlay = makeEvent('game_play', null, mixin(Base, GamePlay));
export const passThreadControl = makeEvent(
  'pass_thread_control',
  null,
  mixin(Base, PassThreadControl)
);
export const takeThreadControl = makeEvent(
  'take_thread_control',
  null,
  mixin(Base, TakeThreadControl)
);
export const requestThreadControl = makeEvent(
  'request_thread_control',
  null,
  mixin(Base, RequestThreadControl)
);
export const appRoles = makeEvent('app_roles', null, mixin(Base, AppRoles));
export const optin = makeEvent('optin', null, mixin(Base, Optin));
export const payment = makeEvent('payment', null, mixin(Base, Payment));
export const policyEnforcement = makeEvent(
  'policy_enforcement',
  null,
  mixin(Base, PolicyEnforcement)
);

const PostbackProto = mixin(Base, Postback);
export const postback = makeEvent('postback', null, PostbackProto);
export const standbyPostback = makeEvent('standby', 'postback', PostbackProto);

export const paymentPreCheckout = makeEvent(
  'payment_pre_checkout',
  null,
  mixin(Base, PaymentPreCheckout)
);
export const referral = makeEvent('referral', null, mixin(Base, Referral));

export const unknown = makeEvent('unknown', null, mixin(Base));
