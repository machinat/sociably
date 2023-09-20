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
  ip?: string;
  osName?: string;
  deviceModel?: string;
  deviceType?: string;
  browserName?: string;
};

export type CodeMessageComponent =
  | FunctionalComponent<CodeMessageComponentProps>
  | ContainerComponent<CodeMessageComponentProps>;

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

type ErrorResult = {
  ok: false;
  code: number;
  reason: string;
};

export type CheckCurrentAuthUsabilityFn<Credential, Data> = (
  credential: Credential,
  data: Data,
) => { ok: boolean };

export type VerifyCredentialFn<Credential, Data> = (
  credential: Credential,
) => Promise<{ ok: true; data: Data } | ErrorResult>;

export type CheckAuthDataFn<Data, Thread extends SociablyThread> = (
  /** The auth data to be checked */
  data: Data,
) =>
  | {
      ok: true;
      thread: Thread;
      data: Data;
      chatLinkUrl: string;
    }
  | ErrorResult;

export type AuthDelegatorOptions<
  Credential,
  Data,
  Thread extends SociablyThread,
> = {
  platform: string;
  bot: SociablyBot<Thread, unknown, unknown>;
  platformName: string;
  platformImageUrl: string;
  platformColor: string;
  checkCurrentAuthUsability: CheckCurrentAuthUsabilityFn<Credential, Data>;
  verifyCredential: VerifyCredentialFn<Credential, Data>;
  checkAuthData: CheckAuthDataFn<Data, Thread>;
};
