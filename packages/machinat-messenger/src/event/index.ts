/** @internal */ /** */
import {
  text,
  image,
  video,
  audio,
  file,
  location,
  productTemplate,
  fallback,
  quickReplyPostback,
  postback,
  reaction,
  referral,
  read,
  delivery,
  accountLinking,
  gamePlay,
  passThreadControl,
  takeThreadControl,
  requestThreadControl,
  appRoles,
  optin,
  policyEnforcement,
  echoText,
  echoImage,
  echoVideo,
  echoAudio,
  echoFile,
  echoTemplate,
  echoFallback,
  standbyText,
  standbyImage,
  standbyVideo,
  standbyAudio,
  standbyFile,
  standbyFallback,
  standbyLocation,
  standbyProductTemplate,
  standbyRead,
  standbyDelivery,
  standbyPostback,
  standbyQuickReplyPostback,
  unknown,
} from './factory';
import type { MessengerRawEvent } from '../types';
import type { MessengerEvent } from './types';

const objectHasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwnProperty = (obj, prop) => objectHasOwnProperty.call(obj, prop);

const createMessageEvent = (payload: MessengerRawEvent, isStandby: boolean) => {
  const { message } = payload;
  if (hasOwnProperty(message, 'text')) {
    if (hasOwnProperty(message, 'quick_reply')) {
      return isStandby
        ? standbyQuickReplyPostback(payload)
        : quickReplyPostback(payload);
    }

    return message.is_echo
      ? echoText(payload)
      : isStandby
      ? standbyText(payload)
      : text(payload);
  }

  switch (message.attachments[0].type) {
    case 'image':
      return message.is_echo
        ? echoImage(payload)
        : isStandby
        ? standbyImage(payload)
        : image(payload);
    case 'video':
      return message.is_echo
        ? echoVideo(payload)
        : isStandby
        ? standbyVideo(payload)
        : video(payload);
    case 'audio':
      return message.is_echo
        ? echoAudio(payload)
        : isStandby
        ? standbyAudio(payload)
        : audio(payload);
    case 'file':
      return message.is_echo
        ? echoFile(payload)
        : isStandby
        ? standbyFile(payload)
        : file(payload);
    case 'location':
      return isStandby ? standbyLocation(payload) : location(payload);
    case 'template':
      return message.is_echo
        ? echoTemplate(payload)
        : hasOwnProperty(message.attachments[0].payload, 'product')
        ? isStandby
          ? standbyProductTemplate(payload)
          : productTemplate(payload)
        : unknown(payload);
    case 'fallback':
      return message.is_echo
        ? echoFallback(payload)
        : isStandby
        ? standbyFallback(payload)
        : fallback(payload);
    default:
      return unknown(payload);
  }
};

/** @internal */
const createEvent = (
  isStandby: boolean,
  payload: MessengerRawEvent
): MessengerEvent =>
  hasOwnProperty(payload, 'message')
    ? createMessageEvent(payload, isStandby)
    : hasOwnProperty(payload, 'reaction')
    ? reaction(payload)
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
    : hasOwnProperty(payload, 'policy-enforcement')
    ? policyEnforcement(payload)
    : hasOwnProperty(payload, 'postback')
    ? isStandby
      ? standbyPostback(payload)
      : postback(payload)
    : hasOwnProperty(payload, 'referral')
    ? referral(payload)
    : unknown(payload);

export default createEvent;
