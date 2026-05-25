export type NoneAuthData = object;

export type NoneAuthContext = {
  platform: 'none';
  agent: null;
  user: null;
  thread: null;
  loginAt: Date;
  expireAt: Date;
};
