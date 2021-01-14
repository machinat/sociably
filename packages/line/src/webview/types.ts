import { AuthContextBase } from '@machinat/auth/types';
import type { LineUserProfile } from '../profiler';
import type LineUser from '../user';
import type LineChat from '../channel';

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

export type LineAuthData = {
  providerId: string;
  channelId: string;
  clientId: string;
  os: 'ios' | 'android' | 'web';
  language: string;
  userId: string;
  groupId: undefined | string;
  roomId: undefined | string;
  name: undefined | string;
  picture: undefined | string;
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

export type LineAuthCredential = {
  accessToken: string;
  os: 'ios' | 'android' | 'web';
  language: string;
  userId: string;
  groupId: undefined | string;
  roomId: undefined | string;
};

export type LineVerifyAuthResult =
  | { success: true; data: LineAuthData }
  | { success: false; code: number; reason: string };

export type AuthorizerRefinement = {
  user: LineUser;
  channel: LineChat;
};

export type AuthorizerCredentialResult = {
  success: true;
  credential: LineAuthCredential;
};
