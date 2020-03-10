// @flow
import mixin from '@machinat/core/utils/mixin';
import {
  EventBase as Base,
  Message,
  Repliable,
  Text,
  Media,
  File,
  Location,
  Sticker,
  Postback,
  DateParam,
  TimeParam,
  DatetimeParam,
  Beacon,
  AccountLink,
  DeviceLink,
} from './mixin';
import type { LineRawEvent, LineEvent } from '../types';

export const eventFactory = (proto: Object, type: string, subtype?: string) => (
  payload: LineRawEvent
): LineEvent => {
  const event = Object.create(proto);

  event.payload = payload;
  event.type = type;
  event.subtype = subtype;

  // TODO: type the line events
  return (event: any);
};

export const text = eventFactory(
  mixin(Base, Message, Repliable, Text),
  'message',
  'text'
);

const MediaProto = mixin(Base, Message, Repliable, Media);
export const image = eventFactory(MediaProto, 'message', 'image');
export const video = eventFactory(MediaProto, 'message', 'video');
export const audio = eventFactory(MediaProto, 'message', 'audio');

export const file = eventFactory(
  mixin(Base, Message, Repliable, Media, File),
  'message',
  'file'
);

export const location = eventFactory(
  mixin(Base, Message, Repliable, Location),
  'message',
  'location'
);

export const sticker = eventFactory(
  mixin(Base, Message, Repliable, Sticker),
  'message',
  'sticker'
);

const BaseProto = mixin(Base);
const RepliableProto = mixin(Base, Repliable);

export const follow = eventFactory(RepliableProto, 'follow');
export const unfollow = eventFactory(BaseProto, 'unfollow');
export const join = eventFactory(RepliableProto, 'join');
export const leave = eventFactory(BaseProto, 'leave');

export const postback = eventFactory(
  mixin(Base, Repliable, Postback),
  'postback'
);
export const postbackDate = eventFactory(
  mixin(Base, Repliable, Postback, DateParam),
  'postback',
  'date'
);
export const postbackTime = eventFactory(
  mixin(Base, Repliable, Postback, TimeParam),
  'postback',
  'time'
);
export const postbackDatetime = eventFactory(
  mixin(Base, Repliable, Postback, DatetimeParam),
  'postback',
  'datetime'
);

export const beacon = eventFactory(mixin(Base, Repliable, Beacon), 'beacon');

export const accountLink = eventFactory(
  mixin(Base, Repliable, AccountLink),
  'acount_link'
);

export const deviceLink = eventFactory(
  mixin(Base, Repliable, DeviceLink),
  'things',
  'link'
);

export const deviceUnlink = eventFactory(
  mixin(Base, Repliable, DeviceLink),
  'things',
  'unlink'
);

export const unknown = eventFactory(BaseProto, 'unknown');
