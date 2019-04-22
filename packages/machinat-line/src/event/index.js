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

const createEvent = (
  payload: LineRawEvent,
  useReplyAPI: boolean
): LineEvent => {
  switch (payload.type) {
    case 'message':
      switch (payload.message.type) {
        case 'text':
          return text(payload, useReplyAPI);
        case 'image':
          return image(payload, useReplyAPI);
        case 'video':
          return video(payload, useReplyAPI);
        case 'audio':
          return audio(payload, useReplyAPI);
        case 'file':
          return file(payload, useReplyAPI);
        case 'location':
          return location(payload, useReplyAPI);
        case 'sticker':
          return sticker(payload, useReplyAPI);
        default:
          return unknown(payload, useReplyAPI);
      }
    case 'follow':
      return follow(payload, useReplyAPI);
    case 'unfollow':
      return unfollow(payload, useReplyAPI);
    case 'join':
      return join(payload, useReplyAPI);
    case 'leave':
      return leave(payload, useReplyAPI);
    case 'postback':
      if (payload.postback.params === undefined) {
        return postback(payload, useReplyAPI);
      } else if (payload.postback.params.date !== undefined) {
        return postbackDate(payload, useReplyAPI);
      } else if (payload.postback.params.time !== undefined) {
        return postbackTime(payload, useReplyAPI);
      } else if (payload.postback.params.datetime !== undefined) {
        return postbackDatetime(payload, useReplyAPI);
      }
      return postback(payload, useReplyAPI);
    case 'beacon':
      return beacon(payload, useReplyAPI);
    case 'accountLink':
      return accountLink(payload, useReplyAPI);
    case 'things':
      return payload.things.type === 'link'
        ? deviceLink(payload, useReplyAPI)
        : deviceUnlink(payload, useReplyAPI);
    default:
      return unknown(payload, useReplyAPI);
  }
};

export default createEvent;
