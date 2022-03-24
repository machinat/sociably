import type { AuthContextBase } from '@machinat/auth';
import type LineUserProfile from '../UserProfile';
import type LineUser from '../User';
import type LineChat from '../Chat';
import { LiffContextOs } from '../constant';

export type LiffContext = {
  type: 'utou' | 'group' | 'room' | 'external' | 'none';
  viewType: 'compact' | 'tall' | 'full';
  userId: string;
  utouId?: string;
  groupId?: string;
  roomId?: string;
  availability: {
    shareTargetPicker: {
      permission: boolean;
      minVer: string;
    };
  };
};

export type LineAuthCredential = {
  accessToken: string;
  os: 'ios' | 'android' | 'web';
  language: string;
  userId: string;
  groupId: undefined | string;
  roomId: undefined | string;
};

export type LineAuthData = {
  provider: string;
  channel: string;
  client: string;
  os: LiffContextOs;
  lang: string;
  user: string;
  group: undefined | string;
  room: undefined | string;
  name: undefined | string;
  pic: undefined | string;
};

export type LineAuthContext = {
  platform: 'line';
  providerId: string;
  channelId: string;
  clientId: string;
  channel: LineChat;
  user: LineUser;
  profile: null | LineUserProfile;
  os: 'ios' | 'android' | 'web';
  language: string;
} & AuthContextBase;

export type LineVerifyAuthResult =
  | { ok: true; data: LineAuthData }
  | { ok: false; code: number; reason: string };

export type AuthenticatorRefinement = {
  user: LineUser;
  channel: LineChat;
};

export type AuthenticatorCredentialResult = {
  ok: true;
  credential: LineAuthCredential;
};
