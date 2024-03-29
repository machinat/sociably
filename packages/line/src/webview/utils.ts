/* eslint-disable import/prefer-default-export  */
import type { ContextDetails } from '@sociably/auth';
import LineChannel from '../Channel.js';
import LineUser from '../User.js';
import LineChat from '../Chat.js';
import { LiffOs, RefChatType } from './constant.js';
import type {
  LineAuthContext,
  LineAuthData,
  LiffRefChatType,
} from './types.js';

export const transformRefChatTypeEnumToName = (
  referer: RefChatType
): LiffRefChatType =>
  referer === RefChatType.Utou
    ? 'utou'
    : referer === RefChatType.Group
    ? 'group'
    : referer === RefChatType.Room
    ? 'room'
    : referer === RefChatType.External
    ? 'external'
    : 'none';

export const getAuthContextDetails = ({
  user: userId,
  client: clientId,
  chan: channelId,
  group: groupId,
  room: roomId,
  provider: providerId,
  lang: language,
  os,
  ref,
}: LineAuthData): ContextDetails<LineAuthContext> => ({
  user: new LineUser(providerId, userId),
  channel: channelId ? new LineChannel(channelId) : null,
  thread: !channelId
    ? null
    : groupId
    ? new LineChat(channelId, 'group', groupId)
    : roomId
    ? new LineChat(channelId, 'room', roomId)
    : new LineChat(channelId, 'user', userId),
  clientId,
  providerId,
  language,
  refChatType: transformRefChatTypeEnumToName(ref),
  os: os === LiffOs.Ios ? 'ios' : os === LiffOs.Android ? 'android' : 'web',
});
