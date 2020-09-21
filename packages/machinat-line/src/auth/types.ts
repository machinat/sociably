import type LineUser from '../user';
import type LineChat from '../channel';

export type LIFFContext = {
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

export type LIFFAuthData = {
  os: 'ios' | 'android' | 'web';
  language: string;
  botChannel: void | string;
  contextType: 'utou' | 'group' | 'room' | 'external' | 'none';
  userId: string;
  utouId?: string;
  groupId?: string;
  roomId?: string;
};

export type LIFFCredential = {
  accessToken: string;
  data: LIFFAuthData;
};

export type LineVerifyAuthResult =
  | { success: true; data: LIFFAuthData; refreshable: false }
  | { success: false; code: number; reason: string };

export type AuthorizerRefinement = {
  user: LineUser;
  channel: null | LineChat;
};

export type AuthorizerCredentialResult = {
  success: true;
  credential: LIFFCredential;
};
