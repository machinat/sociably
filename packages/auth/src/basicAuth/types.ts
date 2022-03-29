import {
  MachinatChannel,
  FunctionalComponent,
  ContainerComponent,
  MachinatBot,
} from '@machinat/core';

export type VerifyCodeRequestBody = {
  code: string;
};

export type VerifyCodeResponseBody = {
  ok: boolean;
  retryChances: number;
  redirectTo: string;
};

export type CodeMessageComponentProps = {
  code: string;
  domain: string;
  ip: string;
  osName?: string;
  deviceModel?: string;
  deviceType?: string;
  browserName?: string;
};

export type CodeMessageComponent =
  | FunctionalComponent<CodeMessageComponentProps>
  | ContainerComponent<CodeMessageComponentProps>;

export type CheckAuthDataFn<Data, Channel extends MachinatChannel> = (
  data: Data
) =>
  | { ok: true; channel: Channel; data: Data }
  | { ok: false; code: number; reason: string };

export type BasicAuthOptions = {
  codeMessageComponent?: CodeMessageComponent;
  loginCodeDigits?: number;
  appName?: string;
  appImageUrl?: string;
  maxLoginAttempt?: number;
  loginDuration?: number;
};

export type BasicAuthLoginState<Data> = {
  status: 'login';
  ch: string;
  data: Data;
  redirect: undefined | string;
};

export type BasicAuthVerifyState<Data> = {
  status: 'verify';
  hash: string;
  ts: number;
  ch: string;
  data: Data;
  redirect: undefined | string;
};

export type BasicAuthState<Data> =
  | BasicAuthLoginState<Data>
  | BasicAuthVerifyState<Data>;

export type AuthDelegatorOptions<Data, Channel extends MachinatChannel> = {
  platform: string;
  bot: MachinatBot<Channel, unknown, unknown>;
  platformName: string;
  platformImageUrl: string;
  platformColor: string;
  checkAuthData: CheckAuthDataFn<Data, Channel>;
  getChatLink: (channel: Channel) => string;
};
