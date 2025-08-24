/// <reference lib="DOM" />
/* eslint-disable class-methods-use-this */
import type { CheckDataResult } from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { LINE } from '../constant.js';
import LineChannel from '../Channel.js';
import LineChat from '../Chat.js';
import LineUser from '../User.js';
import LineUserProfile from '../UserProfile.js';
import LineGroupProfile from '../GroupProfile.js';
import {
  LIFF_ID_QUERY_KEY,
  CHAT_CHANNEL_QUERY_KEY,
  ROOM_ID_QUERY_KEY,
  GROUP_ID_QUERY_KEY,
} from './constant.js';
import { getAuthContextDetails } from './utils.js';
import type {
  LineAuthCredential,
  LineAuthData,
  LineAuthContext,
  LineCredentialResult,
  ClientOs,
  LiffRefChatType,
} from './types.js';

type ClientAuthenticatorOptions = {
  liffId?: string;
  shouldLoadLiffSDK?: boolean;
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
  liffId?: string;
  chatChannelId?: string;
  groupId?: string;
  roomId?: string;
  shouldLoadLiffSDK: boolean;
  marshalTypes = [
    LineChannel,
    LineChat,
    LineUser,
    LineUserProfile,
    LineGroupProfile,
  ];

  readonly platform = LINE;

  constructor(options?: ClientAuthenticatorOptions) {
    this.liffId = options?.liffId;
    this.liff = null;
    this.shouldLoadLiffSDK = options?.shouldLoadLiffSDK ?? true;
  }

  async init(
    _url: string,
    _err: null | Error,
    data: null | LineAuthData,
  ): Promise<{ forceSignIn: boolean }> {
    const searchParams = new URLSearchParams(window.location.search);
    this.liffId =
      this.liffId || searchParams.get(LIFF_ID_QUERY_KEY) || undefined;
    this.chatChannelId = searchParams.get(CHAT_CHANNEL_QUERY_KEY) || undefined;
    this.groupId = searchParams.get(GROUP_ID_QUERY_KEY) || undefined;
    this.roomId = searchParams.get(ROOM_ID_QUERY_KEY) || undefined;

    if (!this.liffId) {
      throw new Error(
        'liff id is required on either `options.liffId` or `liffId` query param',
      );
    }

    if (this.shouldLoadLiffSDK) {
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
    await this.liff.init({ liffId: this.liffId });

    if (typeof searchParams.get('liff.state') === 'string') {
      // wait for secondary redirecting during primary redirecting from LIFF
      await waitingForRedirecting();
    }

    return {
      forceSignIn:
        (!!this.chatChannelId && this.chatChannelId !== data?.chan) ||
        (!!this.groupId && this.groupId !== data?.group) ||
        (!!this.roomId && this.roomId !== data?.room),
    };
  }

  async fetchCredential(): Promise<LineCredentialResult> {
    if (!this.liff.isLoggedIn()) {
      this.liff.login({ redirectUri: window.location.href });
      return waitingForRedirecting();
    }

    const context = this.liff.getContext();
    const accessToken = this.liff.getAccessToken();
    if (!accessToken || !context?.userId) {
      return {
        ok: false,
        code: 401,
        reason: 'no auth info from auth',
      };
    }

    const { type: contextType, userId } = context;
    return {
      ok: true,
      credential: {
        chatChannelId: this.chatChannelId,
        groupId: this.groupId,
        roomId: this.roomId,
        accessToken,
        userId,
        contextType: contextType as LiffRefChatType,
        os: this.liff.getOS() as ClientOs,
        language: this.liff.getLanguage(),
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
    this.liff.closeWindow();
    return true;
  }
}

export default LineClientAuthenticator;
