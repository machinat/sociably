import type { MemoizedUser, MemoizedThread } from './instance';

export type MemoizedAuthData = {
  user: string;
  thread: string;
};

export type MemoizedAuthContext = {
  platform: 'none';
  channel: null;
  user: MemoizedUser;
  thread: MemoizedThread;
  loginAt: Date;
  expireAt: Date;
};
