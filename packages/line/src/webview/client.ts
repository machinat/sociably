// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import invariant from 'invariant';
import type { ContextResult } from '@machinat/auth';
import type { WebviewClientAuthorizer } from '@machinat/webview';
import { LINE } from '../constant';
import LineChat from '../channel';
import LineUser from '../user';
import { LineUserProfile, LineGroupProfile } from '../profiler';
import { supplementContext } from './utils';
import type {
  LineAuthCredential,
  LineAuthData,
  LineAuthContext,
  LiffContext,
  AuthorizerCredentialResult,
} from './types';

type ClientAuthorizerOptions = {
  liffId: string;
  shouldLoadSDK?: boolean;
};

const waitingForRedirecting = (): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('redirect timeout'));
    }, 10000);
  });

class LineClientAuthorizer
  implements
    WebviewClientAuthorizer<LineAuthCredential, LineAuthData, LineAuthContext>
{
  liff: any;
  liffId: string;
  shouldLoadSDK: boolean;

  platform = LINE;
  marshalTypes = [LineChat, LineUser, LineUserProfile, LineGroupProfile];

  constructor(options: ClientAuthorizerOptions) {
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

  async fetchCredential(): Promise<AuthorizerCredentialResult> {
    const { liff } = this;
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return waitingForRedirecting();
    }

    const { userId, groupId, roomId }: LiffContext = liff.getContext();
    return {
      success: true,
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
  checkAuthContext(data: LineAuthData): ContextResult<LineAuthContext> {
    return {
      success: true,
      contextSupplment: supplementContext(data),
    };
  }

  closeWebview(): boolean {
    this.liff.closeWindow();
    return true;
  }
}

export default LineClientAuthorizer;
