// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import invariant from 'invariant';
import type { ClientAuthorizer } from '@machinat/auth/types';
import { LINE } from '../constant';
import type LineUser from '../user';
import type LineChat from '../channel';
import type {
  LineAuthContext,
  LineAuthCredential,
  LiffContext,
  AuthorizerRefinement,
  AuthorizerCredentialResult,
} from './types';
import { refineAuthContext } from './utils';

type ClientAuthorizerOptions = {
  liffId: string;
  shouldLoadSDK?: boolean;
  userToBot?: boolean;
};

const BOT_CHANNEL_LABEL_QUERY_KEY = 'userToBot';

const waitingForRedirecting = (): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('redirect timeout'));
    }, 10000);
  });

class LineClientAuthorizer
  implements
    ClientAuthorizer<LineUser, LineChat, LineAuthContext, LineAuthCredential> {
  liff: any;
  liffId: string;
  shouldLoadSDK: boolean;
  isOnUserToBotChat: boolean;
  _searchParams: URLSearchParams;

  platform = LINE;
  shouldResign = true;

  constructor({
    liffId,
    shouldLoadSDK = true,
    userToBot,
  }: ClientAuthorizerOptions) {
    invariant(liffId, 'options.liffId must not be empty');

    this.liffId = liffId;
    this.shouldLoadSDK = shouldLoadSDK;

    this._searchParams = new URLSearchParams(window.location.search);
    this.isOnUserToBotChat =
      typeof userToBot === 'boolean'
        ? userToBot
        : this._searchParams.get(BOT_CHANNEL_LABEL_QUERY_KEY) === 'true';
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

    if (typeof this._searchParams.get('liff.state') === 'string') {
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

    const {
      type: contextType,
      userId,
      utouId,
      groupId,
      roomId,
    }: LiffContext = liff.getContext();

    return {
      success: true,
      credential: {
        accessToken: liff.getAccessToken(),
        context: {
          os: liff.getOS(),
          language: liff.getLanguage(),
          contextType,
          userId,
          utouId,
          groupId,
          roomId,
        },
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(ctx: LineAuthContext): Promise<null | AuthorizerRefinement> {
    return refineAuthContext(ctx);
  }
}

export default LineClientAuthorizer;
