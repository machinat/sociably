import {
  TEXT,
  IMAGE,
  VIDEO,
  AUDIO,
  FILE,
  LOCATION,
  TEMPLATE,
  MESSAGE,
  READ,
  DELIVERY,
  ACCOUNT_LINKING,
  CHECKOUT_UPDATE,
  GAME_PLAY,
  PASS_THREAD_CONTROL,
  TAKE_THREAD_CONTROL,
  REQUEST_THREAD_CONTROL,
  APP_ROLES,
  OPTIN,
  PAYMENT,
  POLICY_ENFORCEMENT,
  POSTBACK,
  PAYMENT_PRE_CHECKOUT,
  REFERRAL,
} from './key';

import {
  text,
  image,
  video,
  audio,
  file,
  location,
  echoedText,
  echoedImage,
  echoedVideo,
  echoedAudio,
  echoedFile,
  echoedLocation,
  echoedTemplate,
  standbyText,
  standbyImage,
  standbyVideo,
  standbyAudio,
  standbyFile,
  standbyLocation,
  read,
  standbyRead,
  delivery,
  standbyDelivery,
  accountLinking,
  checkoutUpdate,
  gamePlay,
  passThreadControl,
  takeThreadControl,
  requestThreadControl,
  appRoles,
  optin,
  payment,
  policyEnforcement,
  postback,
  standbyPostback,
  paymentPreCheckout,
  referral,
  unknown,
} from './event';

const hasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const createMessageEvent = (raw, isStandby) => {
  const { message } = raw;
  if (hasOwnProperty(message, TEXT)) {
    return isStandby
      ? standbyText(raw)
      : message.is_echo
        ? echoedText(raw)
        : text(raw);
  }
  switch (message.attachments[0].type) {
    case IMAGE:
      return isStandby
        ? standbyImage(raw)
        : message.is_echo
          ? echoedImage(raw)
          : image(raw);
    case VIDEO:
      return isStandby
        ? standbyVideo(raw)
        : message.is_echo
          ? echoedVideo(raw)
          : video(raw);
    case AUDIO:
      return isStandby
        ? standbyAudio(raw)
        : message.is_echo
          ? echoedAudio(raw)
          : audio(raw);
    case FILE:
      return isStandby
        ? standbyFile(raw)
        : message.is_echo
          ? echoedFile(raw)
          : file(raw);
    case LOCATION:
      return isStandby
        ? standbyLocation(raw)
        : message.is_echo
          ? echoedLocation(raw)
          : location(raw);
    case TEMPLATE:
      return echoedTemplate(raw);
    default:
      return unknown(raw);
  }
};

// prettier-ignore
const createEvent = (isStandby, raw) =>
  hasOwnProperty(raw, MESSAGE)
    ? createMessageEvent(raw, isStandby)
    : hasOwnProperty(raw, READ)
    ? isStandby
      ? standbyRead(raw)
      : read(raw)
    : hasOwnProperty(raw, DELIVERY)
      ? isStandby
        ? standbyDelivery(raw)
        : delivery(raw)
    : hasOwnProperty(raw, ACCOUNT_LINKING)
    ? accountLinking(raw)
    : hasOwnProperty(raw, CHECKOUT_UPDATE)
    ? checkoutUpdate(raw)
    : hasOwnProperty(raw, GAME_PLAY)
    ? gamePlay(raw)
    : hasOwnProperty(raw, TAKE_THREAD_CONTROL)
    ? takeThreadControl(raw)
    : hasOwnProperty(raw, PASS_THREAD_CONTROL)
    ? passThreadControl(raw)
    : hasOwnProperty(raw, REQUEST_THREAD_CONTROL)
    ? requestThreadControl(raw)
    : hasOwnProperty(raw, APP_ROLES)
    ? appRoles(raw)
    : hasOwnProperty(raw, OPTIN)
    ? optin(raw)
    : hasOwnProperty(raw, PAYMENT)
    ? payment(raw)
    : hasOwnProperty(raw, POLICY_ENFORCEMENT)
    ? policyEnforcement(raw)
    : hasOwnProperty(raw, POSTBACK)
    ? isStandby
      ? standbyPostback(raw)
      : postback(raw)
    : hasOwnProperty(raw, PAYMENT_PRE_CHECKOUT)
    ? paymentPreCheckout(raw)
    : hasOwnProperty(raw, REFERRAL)
    ? referral(raw)
    : unknown(raw);

const eventReducer = (events, rawEvent) => {
  const { messaging, stanby } = rawEvent;
  const eventBody = messaging || stanby;
  const isStandby = !!stanby;
  events.push(createEvent(isStandby, eventBody[0]));
  return events;
};

const eventFactory = entries => entries.reduce(eventReducer, []);

export default eventFactory;
