/** @internal */ /** */
import mixin from '@machinat/core/utils/mixin';
import LineUser from '../user';
import LineChat from '../channel';
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
import { LineEvent, LineRawEvent } from './types';

export const makeEvent = <
  Proto extends object // eslint-disable-line @typescript-eslint/ban-types
>(
  payload: LineRawEvent,
  channel: LineChat,
  user: LineUser,
  proto: Proto
): {
  payload: LineRawEvent;
  user: LineUser;
  channel: LineChat;
} & Proto => {
  const event = Object.create(proto);

  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

const TextProto = mixin(EventBase, Message, Repliable, Text, {
  kind: 'message' as const,
  type: 'text' as const,
});

const MediaProto = mixin(EventBase, Message, Repliable, Media);
const ImageProto = mixin(MediaProto, {
  kind: 'message' as const,
  type: 'image' as const,
});

const PlayableMediaProto = mixin(MediaProto, Playable);
const VedioProto = mixin(PlayableMediaProto, {
  kind: 'message' as const,
  type: 'video' as const,
});
const AudioProto = mixin(PlayableMediaProto, {
  kind: 'message' as const,
  type: 'audio' as const,
});

const FileProto = mixin(EventBase, Message, Repliable, File, {
  kind: 'message' as const,
  type: 'file' as const,
});

const LocationProto = mixin(EventBase, Message, Repliable, Location, {
  kind: 'message' as const,
  type: 'location' as const,
});

const StickerProto = mixin(EventBase, Message, Repliable, Sticker, {
  kind: 'message' as const,
  type: 'sticker' as const,
});

const UnsendProto = mixin(EventBase, Unsend, {
  kind: 'action' as const,
  type: 'unsend' as const,
});

const FollowProto = mixin(EventBase, Repliable, {
  kind: 'action' as const,
  type: 'follow' as const,
});

const UnfollowProto = mixin(EventBase, {
  kind: 'action' as const,
  type: 'unfollow' as const,
});

const JoinProto = mixin(EventBase, Repliable, {
  kind: 'action' as const,
  type: 'join' as const,
});

const LeaveProto = mixin(EventBase, {
  kind: 'action' as const,
  type: 'leave' as const,
});

const MemberJoinProto = mixin(EventBase, Repliable, MemberJoined, {
  kind: 'action' as const,
  type: 'member_join' as const,
});

const MemberLeaveProto = mixin(EventBase, Repliable, MemberLeft, {
  kind: 'action' as const,
  type: 'member_leave' as const,
});

const PostbackProto = mixin(EventBase, Repliable, Postback, {
  kind: 'postback' as const,
  type: 'postback' as const,
});

const PostbackDateProto = mixin(PostbackProto, DateParam, {
  kind: 'postback' as const,
  type: 'date_postback' as const,
});
const PostbackTimeProto = mixin(EventBase, Repliable, Postback, TimeParam, {
  kind: 'postback' as const,
  type: 'time_postback' as const,
});
const PostbackDatetimeProto = mixin(PostbackProto, DatetimeParam, {
  kind: 'postback' as const,
  type: 'datetime_postback' as const,
});

const BeaconProto = mixin(EventBase, Repliable, Beacon, {
  kind: 'beacon' as const,
  type: 'beacon' as const,
});

const AccountLinkProto = mixin(EventBase, Repliable, AccountLink, {
  kind: 'action' as const,
  type: 'account_link' as const,
});

const DeviceLinkProto = mixin(EventBase, Repliable, DeviceLink, {
  kind: 'things' as const,
  type: 'device_link' as const,
});

const DeviceUnlinkProto = mixin(EventBase, Repliable, DeviceLink, {
  kind: 'things' as const,
  type: 'device_unlink' as const,
});

const ScenarioExecutionProto = mixin(DeviceLinkProto, ThingsScenarioExecution, {
  kind: 'things' as const,
  type: 'scenario_result' as const,
});

const UnknownProto = mixin(EventBase, {
  kind: 'unknown' as const,
  type: 'unknown' as const,
});

const eventFactory = (
  providerId: string,
  channelId: string,
  payload: LineRawEvent
): LineEvent => {
  const { type: eventType, source } = payload;
  const channel = LineChat.fromMessagingSource(providerId, channelId, source);
  const user = new LineUser(providerId, channelId, source.userId);

  if (eventType === 'message') {
    const { type: messageType } = payload.message;
    return messageType === 'text'
      ? makeEvent(payload, channel, user, TextProto)
      : messageType === 'image'
      ? makeEvent(payload, channel, user, ImageProto)
      : messageType === 'video'
      ? makeEvent(payload, channel, user, AudioProto)
      : messageType === 'audio'
      ? makeEvent(payload, channel, user, VedioProto)
      : messageType === 'file'
      ? makeEvent(payload, channel, user, FileProto)
      : messageType === 'location'
      ? makeEvent(payload, channel, user, LocationProto)
      : messageType === 'sticker'
      ? makeEvent(payload, channel, user, StickerProto)
      : makeEvent(payload, channel, user, UnknownProto);
  }

  if (eventType === 'postback') {
    const { params } = payload.postback;

    return params === undefined
      ? makeEvent(payload, channel, user, PostbackProto)
      : params.date !== undefined
      ? makeEvent(payload, channel, user, PostbackDateProto)
      : params.time !== undefined
      ? makeEvent(payload, channel, user, PostbackTimeProto)
      : params.datetime !== undefined
      ? makeEvent(payload, channel, user, PostbackDatetimeProto)
      : makeEvent(payload, channel, user, UnknownProto);
  }

  return eventType === 'unsend'
    ? makeEvent(payload, channel, user, UnsendProto)
    : eventType === 'follow'
    ? makeEvent(payload, channel, user, FollowProto)
    : eventType === 'unfollow'
    ? makeEvent(payload, channel, user, UnfollowProto)
    : eventType === 'join'
    ? makeEvent(payload, channel, user, JoinProto)
    : eventType === 'leave'
    ? makeEvent(payload, channel, user, LeaveProto)
    : eventType === 'memberJoined'
    ? makeEvent(payload, channel, user, MemberJoinProto)
    : eventType === 'memberLeft'
    ? makeEvent(payload, channel, user, MemberLeaveProto)
    : eventType === 'beacon'
    ? makeEvent(payload, channel, user, BeaconProto)
    : eventType === 'accountLink'
    ? makeEvent(payload, channel, user, AccountLinkProto)
    : eventType === 'things'
    ? payload.things.type === 'link'
      ? makeEvent(payload, channel, user, DeviceLinkProto)
      : payload.things.type === 'unlink'
      ? makeEvent(payload, channel, user, DeviceUnlinkProto)
      : payload.things.type === 'scenarioResult'
      ? makeEvent(payload, channel, user, ScenarioExecutionProto)
      : makeEvent(payload, channel, user, UnknownProto)
    : makeEvent(payload, channel, user, UnknownProto);
};

export default eventFactory;
