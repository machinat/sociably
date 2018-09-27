import { mixin, makeEvent } from './utils';
import {
  MessengerEventBase,
  MessageBase,
  Text,
  NLP,
  Media,
  Location,
  Echo,
  Template,
  ReadBase,
  DeliveryBase,
  AccountLinkingBase,
  CheckoutUpdateBase,
  GamePlayBase,
  PassThreadControlBase,
  TakeThreadControlBase,
  RequestThreadControlBase,
  AppRolesBase,
  PaymentBase,
  PolicyEnforcementBase,
  PostbackBase,
  PaymentPreCheckoutBase,
  ReferralBase,
} from './descriptor';

const textProto = mixin(MessageBase, Text, NLP);
export const text = makeEvent('text', textProto);
export const standbyText = makeEvent('standby:text', textProto);

const MediaProto = mixin(MessageBase, Media);
export const image = makeEvent('image', MediaProto);
export const video = makeEvent('video', MediaProto);
export const audio = makeEvent('audio', MediaProto);
export const file = makeEvent('file', MediaProto);

export const standbyImage = makeEvent('standby:image', MediaProto);
export const standbyVideo = makeEvent('standby:video', MediaProto);
export const standbyAudio = makeEvent('standby:audio', MediaProto);
export const standbyFile = makeEvent('standby:file', MediaProto);

const locationProto = mixin(MessageBase, Location);
export const location = makeEvent('location', locationProto);
export const standbyLocation = makeEvent('standby:location', locationProto);

export const echoedText = makeEvent(
  'echo:text',
  mixin(MessageBase, Echo, Text)
);
const EchoedMediaProto = mixin(MessageBase, Echo, Media);
export const echoedImage = makeEvent('echo:image', EchoedMediaProto);
export const echoedVideo = makeEvent('echo:video', EchoedMediaProto);
export const echoedAudio = makeEvent('echo:audio', EchoedMediaProto);
export const echoedFile = makeEvent('echo:file', EchoedMediaProto);

export const echoedLocation = makeEvent(
  'echo:location',
  mixin(MessageBase, Echo, Location)
);
export const echoedTemplate = makeEvent(
  'echo:template',
  mixin(MessageBase, Echo, Template)
);

export const read = makeEvent('read', ReadBase);
export const standbyRead = makeEvent('standby:read', ReadBase);

export const delivery = makeEvent('delivery', DeliveryBase);
export const standbyDelivery = makeEvent('standby:delivery', DeliveryBase);

export const accountLinking = makeEvent('account_linking', AccountLinkingBase);
export const checkoutUpdate = makeEvent('checkout_update', CheckoutUpdateBase);
export const gamePlay = makeEvent('game_play', GamePlayBase);
export const passThreadControl = makeEvent(
  'pass_thread_control',
  PassThreadControlBase
);
export const takeThreadControl = makeEvent(
  'take_thread_control',
  TakeThreadControlBase
);
export const requestThreadControl = makeEvent(
  'request_thread_control',
  RequestThreadControlBase
);
export const appRoles = makeEvent('app_roles', AppRolesBase);
export const optin = makeEvent('optin', AppRolesBase);
export const payment = makeEvent('payment', PaymentBase);
export const policyEnforcement = makeEvent(
  'policy_enforcement',
  PolicyEnforcementBase
);

export const postback = makeEvent('postback', PostbackBase);
export const standbyPostback = makeEvent('standby:postback', PostbackBase);

export const paymentPreCheckout = makeEvent(
  'payment_pre_checkout',
  PaymentPreCheckoutBase
);
export const referral = makeEvent('referral', ReferralBase);

export const unknown = makeEvent('unknown', MessengerEventBase);
