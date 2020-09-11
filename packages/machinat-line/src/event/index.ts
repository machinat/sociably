/** @internal */ /** */
import {
  text,
  image,
  video,
  audio,
  file,
  location,
  sticker,
  unsend,
  follow,
  unfollow,
  join,
  leave,
  memberJoin,
  memberLeave,
  postback,
  postbackDate,
  postbackTime,
  postbackDatetime,
  beacon,
  accountLink,
  deviceLink,
  deviceUnlink,
  deviceScenarioResult,
  unknown,
} from './factory';
import { LineEvent, MessageEvent, UnknownEvent, LineRawEvent } from './types';

const createMessageEvent = (
  payload: LineRawEvent
): MessageEvent | UnknownEvent => {
  const { type: messageType } = payload.message;
  return messageType === 'text'
    ? text(payload)
    : messageType === 'image'
    ? image(payload)
    : messageType === 'video'
    ? video(payload)
    : messageType === 'audio'
    ? audio(payload)
    : messageType === 'file'
    ? file(payload)
    : messageType === 'location'
    ? location(payload)
    : messageType === 'sticker'
    ? sticker(payload)
    : unknown(payload);
};

const createPostbackEvent = (payload: LineRawEvent): LineEvent => {
  const { params } = payload.postback;
  return params === undefined
    ? postback(payload)
    : params.date !== undefined
    ? postbackDate(payload)
    : params.time !== undefined
    ? postbackTime(payload)
    : params.datetime !== undefined
    ? postbackDatetime(payload)
    : unknown(payload);
};

const createEvent = (payload: LineRawEvent): LineEvent => {
  const { type: eventType } = payload;
  return eventType === 'message'
    ? createMessageEvent(payload)
    : eventType === 'unsend'
    ? unsend(payload)
    : eventType === 'follow'
    ? follow(payload)
    : eventType === 'unfollow'
    ? unfollow(payload)
    : eventType === 'join'
    ? join(payload)
    : eventType === 'leave'
    ? leave(payload)
    : eventType === 'memberJoined'
    ? memberJoin(payload)
    : eventType === 'memberLeft'
    ? memberLeave(payload)
    : eventType === 'postback'
    ? createPostbackEvent(payload)
    : eventType === 'beacon'
    ? beacon(payload)
    : eventType === 'accountLink'
    ? accountLink(payload)
    : eventType === 'things'
    ? payload.things.type === 'link'
      ? deviceLink(payload)
      : payload.things.type === 'unlink'
      ? deviceUnlink(payload)
      : payload.things.type === 'scenarioResult'
      ? deviceScenarioResult(payload)
      : unknown(payload)
    : unknown(payload);
};

export default createEvent;
