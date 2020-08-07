// @flow
import {
  text,
  quickReplyPostback,
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
  preCheckout,
  referral,
  unknown,
} from './factory';
import type { MessengerRawEvent } from '../types';

const objectHasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwnProperty = (obj, prop) => objectHasOwnProperty.call(obj, prop);

const createMessageEvent = (payload, isStandby) => {
  const { message } = payload;
  if (hasOwnProperty(message, 'text')) {
    if (hasOwnProperty(message, 'quick_reply')) {
      return quickReplyPostback(payload);
    }

    return isStandby
      ? standbyText(payload)
      : message.is_echo
      ? echoedText(payload)
      : text(payload);
  }

  switch (message.attachments[0].type) {
    case 'image':
      return isStandby
        ? standbyImage(payload)
        : message.is_echo
        ? echoedImage(payload)
        : image(payload);
    case 'video':
      return isStandby
        ? standbyVideo(payload)
        : message.is_echo
        ? echoedVideo(payload)
        : video(payload);
    case 'audio':
      return isStandby
        ? standbyAudio(payload)
        : message.is_echo
        ? echoedAudio(payload)
        : audio(payload);
    case 'file':
      return isStandby
        ? standbyFile(payload)
        : message.is_echo
        ? echoedFile(payload)
        : file(payload);
    case 'location':
      return isStandby
        ? standbyLocation(payload)
        : message.is_echo
        ? echoedLocation(payload)
        : location(payload);
    case 'template':
      return echoedTemplate(payload);
    default:
      return unknown(payload);
  }
};

const createEvent = (isStandby: boolean, payload: MessengerRawEvent) =>
  hasOwnProperty(payload, 'message')
    ? createMessageEvent(payload, isStandby)
    : hasOwnProperty(payload, 'read')
    ? isStandby
      ? standbyRead(payload)
      : read(payload)
    : hasOwnProperty(payload, 'delivery')
    ? isStandby
      ? standbyDelivery(payload)
      : delivery(payload)
    : hasOwnProperty(payload, 'account_linking')
    ? accountLinking(payload)
    : hasOwnProperty(payload, 'checkout_update')
    ? checkoutUpdate(payload)
    : hasOwnProperty(payload, 'game_play')
    ? gamePlay(payload)
    : hasOwnProperty(payload, 'take_thread_control')
    ? takeThreadControl(payload)
    : hasOwnProperty(payload, 'pass_thread_control')
    ? passThreadControl(payload)
    : hasOwnProperty(payload, 'request_thread_control')
    ? requestThreadControl(payload)
    : hasOwnProperty(payload, 'app_roles')
    ? appRoles(payload)
    : hasOwnProperty(payload, 'optin')
    ? optin(payload)
    : hasOwnProperty(payload, 'payment')
    ? payment(payload)
    : hasOwnProperty(payload, 'policy-enforcement')
    ? policyEnforcement(payload)
    : hasOwnProperty(payload, 'postback')
    ? isStandby
      ? standbyPostback(payload)
      : postback(payload)
    : hasOwnProperty(payload, 'pre_checkout')
    ? preCheckout(payload)
    : hasOwnProperty(payload, 'referral')
    ? referral(payload)
    : unknown(payload);

export default createEvent;
