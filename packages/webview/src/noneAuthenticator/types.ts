import type { NoneUser, NoneThread } from './instance';

export type NoneAuthData = {
  user: string;
  thread: string;
};

export type NoneAuthContext = {
  platform: 'none';
  user: NoneUser;
  thread: NoneThread;
  loginAt: Date;
  expireAt: Date;
};
