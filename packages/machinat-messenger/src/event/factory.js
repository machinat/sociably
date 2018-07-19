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

const createMessageEvent = (raw, isStandby) => {
  const { message } = raw;
  if (message[TEXT]) {
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

const createEvent = (isStandby, raw) => {
  if (raw[MESSAGE]) return createMessageEvent(raw, isStandby);
  if (raw[READ]) return isStandby ? standbyRead(raw) : read(raw);
  if (raw[DELIVERY]) return isStandby ? standbyDelivery(raw) : delivery(raw);
  if (raw[ACCOUNT_LINKING]) return accountLinking(raw);
  if (raw[CHECKOUT_UPDATE]) return checkoutUpdate(raw);
  if (raw[GAME_PLAY]) return gamePlay(raw);
  if (raw[TAKE_THREAD_CONTROL]) return takeThreadControl(raw);
  if (raw[PASS_THREAD_CONTROL]) return passThreadControl(raw);
  if (raw[REQUEST_THREAD_CONTROL]) return requestThreadControl(raw);
  if (raw[APP_ROLES]) return appRoles(raw);
  if (raw[OPTIN]) return optin(raw);
  if (raw[PAYMENT]) return payment(raw);
  if (raw[POLICY_ENFORCEMENT]) return policyEnforcement(raw);
  if (raw[POSTBACK]) return isStandby ? standbyPostback(raw) : postback(raw);
  if (raw[PAYMENT_PRE_CHECKOUT]) return paymentPreCheckout(raw);
  if (raw[REFERRAL]) return referral(raw);
  return unknown(raw);
};

const eventReducer = (events, rawEvent) => {
  const { messaging, stanby } = rawEvent;
  const eventBody = messaging || stanby;
  const isStandby = !!stanby;
  events.push(createEvent(isStandby, eventBody[0]));
  return events;
};

const eventFactory = entries => entries.reduce(eventReducer, []);

export default eventFactory;
