/// <reference lib="DOM" />
/* eslint-disable class-methods-use-this */
import invariant from 'invariant';
import type { CheckDataResult } from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import liff from '@line/liff';
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
  LineCredentialResult,
  ClientOs,
  ClientReferer,
} from './types';

type ClientAuthenticatorOptions = {
  liffId: string;
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
  platform = LINE;
  liffId: string;
  marshalTypes = [LineChat, LineUser, LineUserProfile, LineGroupProfile];

  constructor(options: ClientAuthenticatorOptions) {
    invariant(options?.liffId, 'options.liffId must not be empty');
    const { liffId } = options;

    this.liffId = liffId;
  }

  async init(): Promise<void> {
    await liff.init({ liffId: this.liffId });

    const searchParams = new URLSearchParams(window.location.search);
    if (typeof searchParams.get('liff.state') === 'string') {
      // wait for secondary redirecting during primary redirecting of LIFF
      await waitingForRedirecting();
    }
  }

  async fetchCredential(): Promise<LineCredentialResult> {
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return waitingForRedirecting();
    }

    const context = liff.getContext();
    const accessToken = liff.getAccessToken();
    if (!accessToken || !context || !context.userId) {
      return {
        ok: false,
        code: 401,
        reason: 'no auth info from auth',
      };
    }

    const { type: refererType, userId } = context;
    return {
      ok: true,
      credential: {
        accessToken,
        userId,
        refererType: refererType as ClientReferer,
        os: liff.getOS() as ClientOs,
        language: liff.getLanguage(),
      },
    };
  }

  checkAuthData(data: LineAuthData): CheckDataResult<LineAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(): boolean {
    liff.closeWindow();
    return true;
  }
}

export default LineClientAuthenticator;
