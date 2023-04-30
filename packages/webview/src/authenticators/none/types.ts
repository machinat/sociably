export type NoneAuthData = {
  user: string;
  thread: string;
};

export type NoneAuthContext = {
  platform: 'none';
  channel: null;
  user: null;
  thread: null;
  loginAt: Date;
  expireAt: Date;
};
