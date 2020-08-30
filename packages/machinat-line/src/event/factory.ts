/** @internal */ /** */
import mixin from '@machinat/core/utils/mixin';
import {
  EventBase,
  Message,
  Repliable,
  Text,
  Media,
  Playable,
  File,
  Location,
  Sticker,
  Unsend,
  MemberJoined,
  MemberLeft,
  Postback,
  DateParam,
  TimeParam,
  DatetimeParam,
  Beacon,
  AccountLink,
  DeviceLink,
  ThingsScenarioExecution,
} from './mixins';
import type { LineRawEvent } from './types';

export const eventFactory = <
  P extends object, // eslint-disable-line @typescript-eslint/ban-types
  T extends string,
  S extends undefined | string
>(
  proto: P,
  type: T,
  subtype: S
) => (
  payload: LineRawEvent
): { type: T; subtype: S; payload: LineRawEvent } & P => {
  const event = Object.create(proto);

  event.payload = payload;
  event.type = type;
  event.subtype = subtype;

  return event;
};

export const text = eventFactory(
  mixin(EventBase, Message, Repliable, Text),
  'message',
  'text'
);

const MediaProto = mixin(EventBase, Message, Repliable, Media);
export const image = eventFactory(MediaProto, 'message', 'image');

const PlayableMediaProto = mixin(MediaProto, Playable);
export const video = eventFactory(PlayableMediaProto, 'message', 'video');
export const audio = eventFactory(PlayableMediaProto, 'message', 'audio');

export const file = eventFactory(
  mixin(EventBase, Message, Repliable, File),
  'message',
  'file'
);

export const location = eventFactory(
  mixin(EventBase, Message, Repliable, Location),
  'message',
  'location'
);

export const sticker = eventFactory(
  mixin(EventBase, Message, Repliable, Sticker),
  'message',
  'sticker'
);

export const unsend = eventFactory(
  mixin(EventBase, Unsend),
  'unsend',
  undefined
);

const RepliableProto = mixin(EventBase, Repliable);

export const follow = eventFactory(RepliableProto, 'follow', undefined);
export const unfollow = eventFactory(EventBase, 'unfollow', undefined);

export const join = eventFactory(RepliableProto, 'join', undefined);
export const leave = eventFactory(EventBase, 'leave', undefined);

export const memberJoined = eventFactory(
  mixin(RepliableProto, MemberJoined),
  'member_joined',
  undefined
);

export const memberLeft = eventFactory(
  mixin(RepliableProto, MemberLeft),
  'member_left',
  undefined
);

export const postback = eventFactory(
  mixin(EventBase, Repliable, Postback),
  'postback',
  undefined
);
export const postbackDate = eventFactory(
  mixin(EventBase, Repliable, Postback, DateParam),
  'postback',
  'date'
);
export const postbackTime = eventFactory(
  mixin(EventBase, Repliable, Postback, TimeParam),
  'postback',
  'time'
);
export const postbackDatetime = eventFactory(
  mixin(EventBase, Repliable, Postback, DatetimeParam),
  'postback',
  'datetime'
);

export const beacon = eventFactory(
  mixin(EventBase, Repliable, Beacon),
  'beacon',
  undefined
);

export const accountLink = eventFactory(
  mixin(EventBase, Repliable, AccountLink),
  'account_link',
  undefined
);

const DeviceLinkProto = mixin(EventBase, Repliable, DeviceLink);

export const deviceLink = eventFactory(DeviceLinkProto, 'things', 'link');

export const deviceUnlink = eventFactory(DeviceLinkProto, 'things', 'unlink');

export const deviceScenarioResult = eventFactory(
  mixin(DeviceLinkProto, ThingsScenarioExecution),
  'things',
  'scenario_result'
);

export const unknown = eventFactory(EventBase, 'unknown', undefined);
