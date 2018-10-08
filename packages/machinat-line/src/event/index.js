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
  accountLinking,
  unknown,
} from './factory';

export default raw => {
  switch (raw.type) {
    case 'message':
      switch (raw.message.type) {
        case 'text':
          return text(raw);
        case 'image':
          return image(raw);
        case 'video':
          return video(raw);
        case 'audio':
          return audio(raw);
        case 'file':
          return file(raw);
        case 'location':
          return location(raw);
        case 'sticker':
          return sticker(raw);
        default:
          return unknown(raw);
      }
    case 'follow':
      return follow(raw);
    case 'unfollow':
      return unfollow(raw);
    case 'join':
      return join(raw);
    case 'leave':
      return leave(raw);
    case 'postback':
      if (postback.params === undefined) {
        return postback(raw);
      } else if (postback.params.date !== undefined) {
        return postbackDate(raw);
      } else if (postback.params.time !== undefined) {
        return postbackTime(raw);
      } else if (postback.params.datetime !== undefined) {
        return postbackDatetime(raw);
      }
      return postback(raw);
    case 'beacon':
      return beacon(raw);
    case 'accountLink':
      return accountLinking(raw);
    default:
      return unknown(raw);
  }
};
