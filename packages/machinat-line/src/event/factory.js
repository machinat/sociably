import { mixin, makeEvent } from 'machinat-shared';
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
} from './descriptor';

export const text = makeEvent(
  'text',
  null,
  mixin(Base, Message, Repliable, Text)
);

const MediaProto = mixin(Base, Message, Repliable, Media);
export const image = makeEvent('image', null, MediaProto);
export const video = makeEvent('video', null, MediaProto);
export const audio = makeEvent('audio', null, MediaProto);

export const file = makeEvent(
  'file',
  null,
  mixin(Base, Message, Repliable, Media, File)
);

export const location = makeEvent(
  'location',
  null,
  mixin(Base, Message, Repliable, Location)
);

export const sticker = makeEvent(
  'sticker',
  null,
  mixin(Base, Message, Repliable, Sticker)
);

const BaseProto = mixin(Base);
const RepliableProto = mixin(Base, Repliable);

export const follow = makeEvent('follow', null, RepliableProto);
export const unfollow = makeEvent('unfollow', null, BaseProto);
export const join = makeEvent('join', null, RepliableProto);
export const leave = makeEvent('leave', null, BaseProto);

export const postback = makeEvent(
  'postback',
  null,
  mixin(Base, Repliable, Postback)
);
export const postbackDate = makeEvent(
  'postback',
  'date',
  mixin(Base, Repliable, Postback, DateParam)
);
export const postbackTime = makeEvent(
  'postback',
  'time',
  mixin(Base, Repliable, Postback, TimeParam)
);
export const postbackDatetime = makeEvent(
  'postback',
  'datetime',
  mixin(Base, Repliable, Postback, DatetimeParam)
);

export const beacon = makeEvent('beacon', null, mixin(Base, Repliable, Beacon));

export const accountLinking = makeEvent(
  'acount_linking',
  null,
  mixin(Base, Repliable, AccountLink)
);

export const unknown = makeEvent('unknown', null, BaseProto);
