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

export type LineAuthContext = {
  providerId: string;
  channelId: string;
  os: 'ios' | 'android' | 'web';
  language: string;
  contextType: 'utou' | 'group' | 'room' | 'external' | 'none';
  userId: string;
  utouId?: string;
  groupId?: string;
  roomId?: string;
};

export type LineAuthCredential = {
  accessToken: string;
  context: Omit<LineAuthContext, 'providerId' | 'channelId'>;
};

export type LineVerifyAuthResult =
  | { success: true; context: LineAuthContext; refreshable: false }
  | { success: false; code: number; reason: string };

export type AuthorizerRefinement = {
  user: LineUser;
  channel: LineChat;
};

export type AuthorizerCredentialResult = {
  success: true;
  credential: LineAuthCredential;
};
