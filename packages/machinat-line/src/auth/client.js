// @flow
import invariant from 'invariant';
import type { ClientAuthorizer } from '@machinat/auth/types';
import { LINE } from '../constant';
import type { LIFFAuthData, LIFFCredential, LIFFContext } from '../types';
import { refineLIFFContextData } from './utils';

declare var location: Location;
declare var document: Document;
declare var liff: Object;

type ClientAuthorizerOptions = {
  providerId: string,
  botChannelId: string,
  liffId: string,
  isSDKLoaded?: boolean,
  fromBotChannel?: boolean,
};

const LOGIN_TIMEOUT = 10000;
const BOT_CHANNEL_LABEL_QUERY_KEY = 'fromBotChannel';

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

class LineClientAuthorizer
  implements ClientAuthorizer<LIFFAuthData, LIFFCredential> {
  liffId: string;
  providerId: string;
  botChannelId: string;

  isSDKLoaded: boolean;
  isFromBotChannel: boolean;

  platform = LINE;
  shouldResign = true;

  constructor({
    providerId,
    botChannelId,
    liffId,
    isSDKLoaded = false,
    fromBotChannel,
  }: ClientAuthorizerOptions = {}) {
    invariant(providerId, 'options.providerId must not be empty');
    invariant(botChannelId, 'options.botChannelId must not be empty');
    invariant(liffId, 'options.liffId must not be empty');

    this.liffId = liffId;
    this.providerId = providerId;
    this.botChannelId = botChannelId;
    this.isSDKLoaded = isSDKLoaded;

    this.isFromBotChannel =
      typeof fromBotChannel === 'boolean'
        ? fromBotChannel
        : new URLSearchParams(location.search).get(
            BOT_CHANNEL_LABEL_QUERY_KEY
          ) === 'true';
  }

  async init() {
    const { liffId, isSDKLoaded } = this;

    if (!isSDKLoaded) {
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
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchCredential() {
    if (!liff.isLoggedIn()) {
      liff.login();

      await delay(LOGIN_TIMEOUT);
      return {
        success: false,
        code: 408,
        reason: 'timeout for redirecting to line login',
      };
    }

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
          fromBotChannel:
            contextType === 'utou' && this.isFromBotChannel
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

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(data: LIFFAuthData) {
    return refineLIFFContextData(this.providerId, this.botChannelId, data);
  }
}

export default LineClientAuthorizer;
