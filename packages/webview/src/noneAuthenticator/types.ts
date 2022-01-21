import type { NoneUser, NoneChannel } from './instance';

export type NoneAuthData = {
  user: string;
  channel: string;
};

export type NoneAuthContext = {
  platform: 'none';
  user: NoneUser;
  channel: NoneChannel;
  loginAt: Date;
  expireAt: Date;
};
