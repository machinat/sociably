// @flow
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
} from './factory';
import type { MessengerRawEvent } from '../types';

const hasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const createMessageEvent = (raw, isStandby) => {
  const { message } = raw;
  if (hasOwnProperty(message, 'text')) {
    return isStandby
      ? standbyText(raw)
      : message.is_echo
      ? echoedText(raw)
      : text(raw);
  }
  switch (message.attachments[0].type) {
    case 'image':
      return isStandby
        ? standbyImage(raw)
        : message.is_echo
        ? echoedImage(raw)
        : image(raw);
    case 'video':
      return isStandby
        ? standbyVideo(raw)
        : message.is_echo
        ? echoedVideo(raw)
        : video(raw);
    case 'audio':
      return isStandby
        ? standbyAudio(raw)
        : message.is_echo
        ? echoedAudio(raw)
        : audio(raw);
    case 'file':
      return isStandby
        ? standbyFile(raw)
        : message.is_echo
        ? echoedFile(raw)
        : file(raw);
    case 'location':
      return isStandby
        ? standbyLocation(raw)
        : message.is_echo
        ? echoedLocation(raw)
        : location(raw);
    case 'template':
      return echoedTemplate(raw);
    default:
      return unknown(raw);
  }
};

const createEvent = (isStandby: boolean, raw: MessengerRawEvent) =>
  hasOwnProperty(raw, 'message')
    ? createMessageEvent(raw, isStandby)
    : hasOwnProperty(raw, 'read')
    ? isStandby
      ? standbyRead(raw)
      : read(raw)
    : hasOwnProperty(raw, 'delivery')
    ? isStandby
      ? standbyDelivery(raw)
      : delivery(raw)
    : hasOwnProperty(raw, 'account_linking')
    ? accountLinking(raw)
    : hasOwnProperty(raw, 'checkout_update')
    ? checkoutUpdate(raw)
    : hasOwnProperty(raw, 'game_play')
    ? gamePlay(raw)
    : hasOwnProperty(raw, 'take_thread_control')
    ? takeThreadControl(raw)
    : hasOwnProperty(raw, 'pass_thread_control')
    ? passThreadControl(raw)
    : hasOwnProperty(raw, 'request_thread_control')
    ? requestThreadControl(raw)
    : hasOwnProperty(raw, 'app_roles')
    ? appRoles(raw)
    : hasOwnProperty(raw, 'optin')
    ? optin(raw)
    : hasOwnProperty(raw, 'payment')
    ? payment(raw)
    : hasOwnProperty(raw, 'policy-enforcement')
    ? policyEnforcement(raw)
    : hasOwnProperty(raw, 'postback')
    ? isStandby
      ? standbyPostback(raw)
      : postback(raw)
    : hasOwnProperty(raw, 'payment_pre_checkout')
    ? paymentPreCheckout(raw)
    : hasOwnProperty(raw, 'referral')
    ? referral(raw)
    : unknown(raw);

export default createEvent;
