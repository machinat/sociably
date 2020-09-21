// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import invariant from 'invariant';
import type { ClientAuthorizer } from '@machinat/auth/types';
import { LINE } from '../constant';
import type {
  LIFFAuthData,
  LIFFCredential,
  LIFFContext,
  AuthorizerRefinement,
  AuthorizerCredentialResult,
} from './types';
import { refinementFromLIFFAuthData } from './utils';

/** @ignore */
declare let liff: any;

type ClientAuthorizerOptions = {
  providerId: string;
  botChannelId: string;
  liffId: string;
  shouldLoadSDK?: boolean;
  onBotChannel?: boolean;
};

const BOT_CHANNEL_LABEL_QUERY_KEY = 'onBotChannel';

class LineClientAuthorizer
  implements ClientAuthorizer<LIFFAuthData, LIFFCredential> {
  liffId: string;
  providerId: string;
  botChannelId: string;

  shouldLoadSDK: boolean;
  isOnBotChannel: boolean;

  platform = LINE;
  shouldResign = true;

  constructor(
    {
      providerId,
      botChannelId,
      liffId,
      shouldLoadSDK = true,
      onBotChannel,
    }: ClientAuthorizerOptions = {} as any
  ) {
    invariant(providerId, 'options.providerId must not be empty');
    invariant(botChannelId, 'options.botChannelId must not be empty');
    invariant(liffId, 'options.liffId must not be empty');

    this.liffId = liffId;
    this.providerId = providerId;
    this.botChannelId = botChannelId;
    this.shouldLoadSDK = shouldLoadSDK;

    this.isOnBotChannel =
      typeof onBotChannel === 'boolean'
        ? onBotChannel
        : new URLSearchParams(window.location.search).get(
            BOT_CHANNEL_LABEL_QUERY_KEY
          ) === 'true';
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

    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }

  async fetchCredential(): Promise<AuthorizerCredentialResult> {
    const {
      type: contextType,
      userId,
      utouId,
      groupId,
      roomId,
    }: LIFFContext = liff.getContext();

    return {
      success: true,
      credential: {
        accessToken: liff.getAccessToken(),
        data: {
          os: liff.getOS(),
          language: liff.getLanguage(),
          botChannel:
            contextType === 'utou' && this.isOnBotChannel
              ? this.botChannelId
              : undefined,
          contextType,
          userId,
          utouId,
          groupId,
          roomId,
        },
      },
    };
  }

  async refineAuth(data: LIFFAuthData): Promise<null | AuthorizerRefinement> {
    return refinementFromLIFFAuthData(this.providerId, this.botChannelId, data);
  }
}

export default LineClientAuthorizer;
