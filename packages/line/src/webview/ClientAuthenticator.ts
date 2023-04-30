/// <reference lib="DOM" />
/* eslint-disable class-methods-use-this */
import type { CheckDataResult } from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import liff from '@line/liff';
import { LINE } from '../constant';
import LineChannel from '../Channel';
import LineChat from '../Chat';
import LineUser from '../User';
import LineUserProfile from '../UserProfile';
import LineGroupProfile from '../GroupProfile';
import {
  CHAT_CHANNEL_QUERY_KEY,
  LIFF_ID_QUERY_KEY,
  ROOM_ID_QUERY_KEY,
  GROUP_ID_QUERY_KEY,
} from './constant';
import { getAuthContextDetails } from './utils';
import type {
  LineAuthCredential,
  LineAuthData,
  LineAuthContext,
  LineCredentialResult,
  ClientOs,
  LiffRefChatType,
} from './types';

type ClientAuthenticatorOptions = {
  liffId?: string;
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
  marshalTypes = [
    LineChannel,
    LineChat,
    LineUser,
    LineUserProfile,
    LineGroupProfile,
  ];

  constructor(options?: ClientAuthenticatorOptions) {
    const searchParams = new URLSearchParams(window.location.search);
    const liffId = options?.liffId ?? searchParams.get(LIFF_ID_QUERY_KEY);

    if (!liffId) {
      throw new Error(
        'liff id is required on either `options.liffId` or `liffId` query param'
      );
    }
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

    const searchParams = new URLSearchParams(window.location.search);
    const { type: contextType, userId } = context;
    return {
      ok: true,
      credential: {
        chatChannelId: searchParams.get(CHAT_CHANNEL_QUERY_KEY) || undefined,
        groupId: searchParams.get(GROUP_ID_QUERY_KEY) || undefined,
        roomId: searchParams.get(ROOM_ID_QUERY_KEY) || undefined,
        accessToken,
        userId,
        contextType: contextType as LiffRefChatType,
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
