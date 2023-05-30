import type MemoCacheTarget from './CacheTarget.js';

export type MemoAuthData = {
  user: string;
  thread: string;
};

export type MemoAuthContext = {
  platform: 'none';
  channel: null;
  user: MemoCacheTarget;
  thread: MemoCacheTarget;
  loginAt: Date;
  expireAt: Date;
};
