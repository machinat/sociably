import type {
  AuthContextBase,
  AuthenticatorCredentialResult,
} from '@sociably/auth';
import type LineUser from '../User';
import type LineChat from '../Chat';
import { LiffOs, LiffReferer } from '../constant';

export type ClientOs = 'ios' | 'android' | 'web';

export type ClientReferer = 'utou' | 'group' | 'room' | 'external' | 'none';

export type LineAuthCredential = {
  accessToken: string;
  refererType: ClientReferer;
  os: ClientOs;
  language: string;
  userId: string;
};

export type LineAuthData = {
  provider: string;
  channel: string;
  client: string;
  ref: LiffReferer;
  os: LiffOs;
  lang: string;
  user: string;
};

export type LineAuthContext = {
  platform: 'line';
  providerId: string;
  clientId: string;
  thread: null | LineChat;
  user: LineUser;
  os: ClientOs;
  refererType: ClientReferer;
  language: string;
} & AuthContextBase;

export type LineVerifyAuthResult =
  | { ok: true; data: LineAuthData }
  | { ok: false; code: number; reason: string };

export type LineCredentialResult =
  AuthenticatorCredentialResult<LineAuthCredential>;
