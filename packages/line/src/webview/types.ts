import type {
  AuthContextBase,
  AuthenticatorCredentialResult,
} from '@sociably/auth';
import type LineChannel from '../Channel.js';
import type LineUser from '../User.js';
import type LineChat from '../Chat.js';
import { LiffOs, RefChatType } from './constant.js';

export type ClientOs = 'ios' | 'android' | 'web';

export type LiffRefChatType = 'utou' | 'group' | 'room' | 'external' | 'none';

export type LineAuthCredential = {
  accessToken: string;
  chatChannelId?: string;
  groupId?: string;
  roomId?: string;
  contextType: LiffRefChatType;
  os: ClientOs;
  language: string;
  userId: string;
};

export type LineAuthData = {
  provider: string;
  chan?: string;
  group?: string;
  room?: string;
  client: string;
  ref: RefChatType;
  os: LiffOs;
  lang: string;
  user: string;
};

export type LineAuthContext = {
  platform: 'line';
  providerId: string;
  clientId: string;
  channel: null | LineChannel;
  thread: null | LineChat;
  user: LineUser;
  os: ClientOs;
  refChatType: LiffRefChatType;
  language: string;
} & AuthContextBase;

export type FailedLineVerifyAuthResult = {
  ok: false;
  code: number;
  reason: string;
};

export type OkLineVerifyAuthResult = { ok: true; data: LineAuthData };

export type LineVerifyAuthResult =
  | OkLineVerifyAuthResult
  | FailedLineVerifyAuthResult;

export type LineCredentialResult =
  AuthenticatorCredentialResult<LineAuthCredential>;
