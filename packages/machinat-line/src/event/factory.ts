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
  C extends string,
  T extends string
>(
  proto: P,
  category: C,
  type: T
) => (
  payload: LineRawEvent
): { category: C; type: T; payload: LineRawEvent } & P => {
  const event = Object.create(proto);

  event.payload = payload;
  event.category = category;
  event.type = type;

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
  'action',
  'unsend'
);

const RepliableProto = mixin(EventBase, Repliable);

export const follow = eventFactory(RepliableProto, 'action', 'follow');
export const unfollow = eventFactory(EventBase, 'action', 'unfollow');

export const join = eventFactory(RepliableProto, 'action', 'join');
export const leave = eventFactory(EventBase, 'action', 'leave');

export const memberJoined = eventFactory(
  mixin(RepliableProto, MemberJoined),
  'action',
  'member_joined'
);

export const memberLeft = eventFactory(
  mixin(RepliableProto, MemberLeft),
  'action',
  'member_left'
);

export const postback = eventFactory(
  mixin(EventBase, Repliable, Postback),
  'postback',
  'postback'
);
export const postbackDate = eventFactory(
  mixin(EventBase, Repliable, Postback, DateParam),
  'postback',
  'date_postback'
);
export const postbackTime = eventFactory(
  mixin(EventBase, Repliable, Postback, TimeParam),
  'postback',
  'time_postback'
);
export const postbackDatetime = eventFactory(
  mixin(EventBase, Repliable, Postback, DatetimeParam),
  'postback',
  'datetime_postback'
);

export const beacon = eventFactory(
  mixin(EventBase, Repliable, Beacon),
  'beacon',
  'beacon'
);

export const accountLink = eventFactory(
  mixin(EventBase, Repliable, AccountLink),
  'action',
  'account_link'
);

const DeviceLinkProto = mixin(EventBase, Repliable, DeviceLink);

export const deviceLink = eventFactory(
  DeviceLinkProto,
  'things',
  'device_link'
);

export const deviceUnlink = eventFactory(
  DeviceLinkProto,
  'things',
  'device_unlink'
);

export const deviceScenarioResult = eventFactory(
  mixin(DeviceLinkProto, ThingsScenarioExecution),
  'things',
  'scenario_result'
);

export const unknown = eventFactory(EventBase, 'unknown', 'unknown');
