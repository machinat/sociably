import {
  SociablyThread,
  FunctionalComponent,
  ContainerComponent,
  SociablyBot,
} from '@sociably/core';

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

type ErrorResult = { ok: false; code: number; reason: string };

export type VerifyCredentialFn<Credential, Data> = (
  credential: Credential
) => Promise<{ ok: true; data: Data } | ErrorResult>;

export type CheckAuthDataFn<Data, Thread extends SociablyThread> = (
  data: Data
) => { ok: true; thread: Thread; data: Data } | ErrorResult;

export type BasicAuthOptions = {
  codeMessageComponent?: CodeMessageComponent;
  loginCodeDigits?: number;
  appName?: string;
  appIconUrl?: string;
  maxLoginAttempt?: number;
  loginDuration?: number;
  mode?: 'loose' | 'strict';
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

export type AuthDelegatorOptions<
  Credential,
  Data,
  Thread extends SociablyThread
> = {
  platform: string;
  bot: SociablyBot<Thread, unknown, unknown>;
  platformName: string;
  platformImageUrl: string;
  platformColor: string;
  verifyCredential: VerifyCredentialFn<Credential, Data>;
  checkAuthData: CheckAuthDataFn<Data, Thread>;
  getChatLink: (thread: Thread, data: Data) => string;
};
