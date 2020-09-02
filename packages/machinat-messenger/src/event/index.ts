/** @internal */ /** */
import {
  text,
  echoText,
  image,
  echoImage,
  video,
  echoVideo,
  audio,
  echoAudio,
  file,
  echoFile,
  location,
  productTemplate,
  echoTemplate,
  fallback,
  echoFallback,
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
      return quickReplyPostback(payload, isStandby);
    }

    return message.is_echo ? echoText(payload) : text(payload, isStandby);
  }

  switch (message.attachments[0].type) {
    case 'image':
      return message.is_echo ? echoImage(payload) : image(payload, isStandby);
    case 'video':
      return message.is_echo ? echoVideo(payload) : video(payload, isStandby);
    case 'audio':
      return message.is_echo ? echoAudio(payload) : audio(payload, isStandby);
    case 'file':
      return message.is_echo ? echoFile(payload) : file(payload, isStandby);
    case 'location':
      return location(payload, isStandby);
    case 'template':
      return message.is_echo
        ? echoTemplate(payload)
        : hasOwnProperty(message.attachments[0].payload, 'product')
        ? productTemplate(payload, isStandby)
        : unknown(payload);
    case 'fallback':
      return message.is_echo ? echoFallback(payload) : fallback(payload);
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
    ? read(payload, isStandby)
    : hasOwnProperty(payload, 'delivery')
    ? delivery(payload, isStandby)
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
    ? postback(payload, isStandby)
    : hasOwnProperty(payload, 'referral')
    ? referral(payload)
    : unknown(payload);

export default createEvent;
