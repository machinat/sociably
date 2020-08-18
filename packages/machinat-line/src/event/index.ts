import type { LineRawEvent, LineEvent } from '../types';
import {
  text,
  image,
  video,
  audio,
  file,
  location,
  sticker,
  follow,
  unfollow,
  join,
  leave,
  postback,
  postbackDate,
  postbackTime,
  postbackDatetime,
  beacon,
  accountLink,
  deviceLink,
  deviceUnlink,
  unknown,
} from './factory';

const createMessageEvent = (payload: LineRawEvent): LineEvent => {
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
    : eventType === 'follow'
    ? follow(payload)
    : eventType === 'unfollow'
    ? unfollow(payload)
    : eventType === 'join'
    ? join(payload)
    : eventType === 'leave'
    ? leave(payload)
    : eventType === 'postback'
    ? createPostbackEvent(payload)
    : eventType === 'beacon'
    ? beacon(payload)
    : eventType === 'accountLink'
    ? accountLink(payload)
    : eventType === 'things'
    ? payload.things.type === 'link'
      ? deviceLink(payload)
      : deviceUnlink(payload)
    : unknown(payload);
};

export default createEvent;
