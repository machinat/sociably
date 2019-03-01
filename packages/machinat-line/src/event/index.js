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

const createEvent = (raw: LineRawEvent, useReplyAPI: boolean): LineEvent => {
  switch (raw.type) {
    case 'message':
      switch (raw.message.type) {
        case 'text':
          return text(raw, useReplyAPI);
        case 'image':
          return image(raw, useReplyAPI);
        case 'video':
          return video(raw, useReplyAPI);
        case 'audio':
          return audio(raw, useReplyAPI);
        case 'file':
          return file(raw, useReplyAPI);
        case 'location':
          return location(raw, useReplyAPI);
        case 'sticker':
          return sticker(raw, useReplyAPI);
        default:
          return unknown(raw, useReplyAPI);
      }
    case 'follow':
      return follow(raw, useReplyAPI);
    case 'unfollow':
      return unfollow(raw, useReplyAPI);
    case 'join':
      return join(raw, useReplyAPI);
    case 'leave':
      return leave(raw, useReplyAPI);
    case 'postback':
      if (raw.postback.params === undefined) {
        return postback(raw, useReplyAPI);
      } else if (raw.postback.params.date !== undefined) {
        return postbackDate(raw, useReplyAPI);
      } else if (raw.postback.params.time !== undefined) {
        return postbackTime(raw, useReplyAPI);
      } else if (raw.postback.params.datetime !== undefined) {
        return postbackDatetime(raw, useReplyAPI);
      }
      return postback(raw, useReplyAPI);
    case 'beacon':
      return beacon(raw, useReplyAPI);
    case 'accountLink':
      return accountLink(raw, useReplyAPI);
    case 'things':
      return raw.things.type === 'link'
        ? deviceLink(raw, useReplyAPI)
        : deviceUnlink(raw, useReplyAPI);
    default:
      return unknown(raw, useReplyAPI);
  }
};

export default createEvent;
