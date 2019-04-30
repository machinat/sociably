// @flow
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

const createEvent = (payload: LineRawEvent): LineEvent => {
  switch (payload.type) {
    case 'message':
      switch (payload.message.type) {
        case 'text':
          return text(payload);
        case 'image':
          return image(payload);
        case 'video':
          return video(payload);
        case 'audio':
          return audio(payload);
        case 'file':
          return file(payload);
        case 'location':
          return location(payload);
        case 'sticker':
          return sticker(payload);
        default:
          return unknown(payload);
      }
    case 'follow':
      return follow(payload);
    case 'unfollow':
      return unfollow(payload);
    case 'join':
      return join(payload);
    case 'leave':
      return leave(payload);
    case 'postback':
      if (payload.postback.params === undefined) {
        return postback(payload);
      } else if (payload.postback.params.date !== undefined) {
        return postbackDate(payload);
      } else if (payload.postback.params.time !== undefined) {
        return postbackTime(payload);
      } else if (payload.postback.params.datetime !== undefined) {
        return postbackDatetime(payload);
      }
      return postback(payload);
    case 'beacon':
      return beacon(payload);
    case 'accountLink':
      return accountLink(payload);
    case 'things':
      return payload.things.type === 'link'
        ? deviceLink(payload)
        : deviceUnlink(payload);
    default:
      return unknown(payload);
  }
};

export default createEvent;
