import {
  TextMessageEvent,
  ImageMessageEvent,
  VideoMessageEvent,
  AudioMessageEvent,
  FileMessageEvent,
  LocationMessageEvent,
  StickerMessageEvent,
  UnsendActionEvent,
  FollowActionEvent,
  UnfollowActionEvent,
  JoinActionEvent,
  LeaveActionEvent,
  MemberJoinedActionEvent,
  MemberLeftActionEvent,
  PostbackCallbackEvent,
  DatePostbackCallbackEvent,
  TimePostbackCallbackEvent,
  DatetimePostbackCallbackEvent,
  BeaconActionEvent,
  AccountLinkActionEvent,
  VideoPlayCompleteActionEvent,
  MembershipJoinedActionEvent,
  MembershipLeftActionEvent,
  MembershipRenewedActionEvent,
  UnknownEvent,
  LineEvent,
} from './events.js';
import type { LineRawEvent } from '../types.js';

const eventFactory = (
  providerId: string,
  channelId: string,
  payload: LineRawEvent,
): LineEvent => {
  const { type: eventType } = payload;

  if (eventType === 'message') {
    const { type: messageType } = payload.message || {};
    return messageType === 'text'
      ? new TextMessageEvent(payload, providerId, channelId)
      : messageType === 'image'
      ? new ImageMessageEvent(payload, providerId, channelId)
      : messageType === 'video'
      ? new VideoMessageEvent(payload, providerId, channelId)
      : messageType === 'audio'
      ? new AudioMessageEvent(payload, providerId, channelId)
      : messageType === 'file'
      ? new FileMessageEvent(payload, providerId, channelId)
      : messageType === 'location'
      ? new LocationMessageEvent(payload, providerId, channelId)
      : messageType === 'sticker'
      ? new StickerMessageEvent(payload, providerId, channelId)
      : new UnknownEvent(payload, providerId, channelId);
  }

  if (eventType === 'postback') {
    const { params } = payload.postback || {};

    return params === undefined
      ? new PostbackCallbackEvent(payload, providerId, channelId)
      : params.date !== undefined
      ? new DatePostbackCallbackEvent(payload, providerId, channelId)
      : params.time !== undefined
      ? new TimePostbackCallbackEvent(payload, providerId, channelId)
      : params.datetime !== undefined
      ? new DatetimePostbackCallbackEvent(payload, providerId, channelId)
      : new UnknownEvent(payload, providerId, channelId);
  }

  if (eventType === 'membership') {
    const { type: membershipType } = payload.membership || {};

    return membershipType === 'joined'
      ? new MembershipJoinedActionEvent(payload, providerId, channelId)
      : membershipType === 'left'
      ? new MembershipLeftActionEvent(payload, providerId, channelId)
      : membershipType === 'renewed'
      ? new MembershipRenewedActionEvent(payload, providerId, channelId)
      : new UnknownEvent(payload, providerId, channelId);
  }

  return eventType === 'unsend'
    ? new UnsendActionEvent(payload, providerId, channelId)
    : eventType === 'follow'
    ? new FollowActionEvent(payload, providerId, channelId)
    : eventType === 'unfollow'
    ? new UnfollowActionEvent(payload, providerId, channelId)
    : eventType === 'join'
    ? new JoinActionEvent(payload, providerId, channelId)
    : eventType === 'leave'
    ? new LeaveActionEvent(payload, providerId, channelId)
    : eventType === 'memberJoined'
    ? new MemberJoinedActionEvent(payload, providerId, channelId)
    : eventType === 'memberLeft'
    ? new MemberLeftActionEvent(payload, providerId, channelId)
    : eventType === 'beacon'
    ? new BeaconActionEvent(payload, providerId, channelId)
    : eventType === 'accountLink'
    ? new AccountLinkActionEvent(payload, providerId, channelId)
    : eventType === 'videoPlayComplete'
    ? new VideoPlayCompleteActionEvent(payload, providerId, channelId)
    : new UnknownEvent(payload, providerId, channelId);
};

export default eventFactory;
