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
  channel: MachinatChannel;
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
  verifyCodeDigits?: number;
  appName?: string;
  appImageUrl?: string;
};

export type BasicAuthState<Data> = {
  hash: string;
  ts: number;
  ch: string;
  data: Data;
  redirect: undefined | string;
};

export type AuthDelegatorOptions<Data, Channel extends MachinatChannel> = {
  platform: string;
  bot: MachinatBot<Channel, unknown, unknown>;
  platformName: string;
  platformImageUrl: string;
  platformColor: string;
  checkAuthData: CheckAuthDataFn<Data, Channel>;
  getChatLink: (channel: Channel) => string;
};
