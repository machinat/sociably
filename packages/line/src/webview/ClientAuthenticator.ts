/// <reference lib="DOM" />
import invariant from 'invariant';
import type { CheckDataResult } from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { LINE } from '../constant';
import LineChat from '../Chat';
import LineUser from '../User';
import LineUserProfile from '../UserProfile';
import LineGroupProfile from '../GroupProfile';
import { getAuthContextDetails } from './utils';
import type {
  LineAuthCredential,
  LineAuthData,
  LineAuthContext,
  LiffContext,
  AuthenticatorCredentialResult,
} from './types';

type ClientAuthenticatorOptions = {
  liffId: string;
  shouldLoadSDK?: boolean;
};

const waitingForRedirecting = (): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('redirect timeout'));
    }, 10000);
  });

class LineClientAuthenticator
  implements
    WebviewClientAuthenticator<
      LineAuthCredential,
      LineAuthData,
      LineAuthContext
    >
{
  liff: any;
  liffId: string;
  shouldLoadSDK: boolean;

  platform = LINE;
  marshalTypes = [LineChat, LineUser, LineUserProfile, LineGroupProfile];

  constructor(options: ClientAuthenticatorOptions) {
    invariant(options?.liffId, 'options.liffId must not be empty');
    const { liffId, shouldLoadSDK = true } = options;

    this.liffId = liffId;
    this.shouldLoadSDK = shouldLoadSDK;
  }

  async init(): Promise<void> {
    const { liffId, shouldLoadSDK } = this;

    if (shouldLoadSDK) {
      const SCRIPT = 'script';
      const js = document.createElement(SCRIPT);
      js.id = 'LIFF';
      js.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      const loadingSDK = new Promise((resolve) => {
        js.onload = resolve;
      });

      const fjs: any = document.getElementsByTagName(SCRIPT)[0];
      fjs.parentNode.insertBefore(js, fjs);

      await loadingSDK;
    }

    this.liff = (window as any).liff;
    await this.liff.init({ liffId });

    const searchParams = new URLSearchParams(window.location.search);
    if (typeof searchParams.get('liff.state') === 'string') {
      // wait for secondary redirecting during primary redirecting from LIFF
      await waitingForRedirecting();
    }
  }

  async fetchCredential(): Promise<AuthenticatorCredentialResult> {
    const { liff } = this;
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return waitingForRedirecting();
    }

    const { userId, groupId, roomId }: LiffContext = liff.getContext();
    return {
      ok: true,
      credential: {
        accessToken: liff.getAccessToken(),
        os: liff.getOS(),
        language: liff.getLanguage(),
        userId,
        groupId,
        roomId,
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthData(data: LineAuthData): CheckDataResult<LineAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(): boolean {
    this.liff.closeWindow();
    return true;
  }
}

export default LineClientAuthenticator;
