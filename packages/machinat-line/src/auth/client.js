// @flow
import invariant from 'invariant';
import type { ClientAuthProvider } from 'machinat-auth/types';
import { LINE } from '../constant';
import type { LIFFAuthData, LIFFCredential } from '../types';
import { refineLIFFContextData } from './utils';

declare var document: Document;
declare var liff: Object;

type ClientAuthProviderOpts = {
  liffId: string,
  isSDKLoaded?: boolean,
};

const LIFF = 'LIFF';

const LOGIN_TIMEOUT = 10000;

const delay = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

class LineClientAuthProvider
  implements ClientAuthProvider<LIFFAuthData, LIFFCredential> {
  liffId: string;
  isSDKLoaded: boolean;

  platform = LINE;
  shouldResign = true;

  constructor({ liffId, isSDKLoaded = false }: ClientAuthProviderOpts = {}) {
    invariant(liffId, 'options.liffId must not be empty');

    this.liffId = liffId;
    this.isSDKLoaded = isSDKLoaded;
  }

  async init() {
    const { liffId, isSDKLoaded } = this;

    if (!isSDKLoaded) {
      const SCRIPT = 'script';
      const js = document.createElement(SCRIPT);
      js.id = LIFF;
      js.src = 'https://static.line-scdn.net/liff/edge/2.1/sdk.js';
      const loadingSDK = new Promise(resolve => {
        js.onload = resolve;
      });

      const fjs: any = document.getElementsByTagName(SCRIPT)[0];
      fjs.parentNode.insertBefore(js, fjs);

      await loadingSDK;
    }

    await liff.init({ liffId });
  }

  // eslint-disable-next-line class-methods-use-this
  async startAuthFlow() {
    if (!liff.isLoggedIn()) {
      liff.login();

      await delay(LOGIN_TIMEOUT);
      return {
        accepted: false,
        code: 408,
        message: 'timeout for redirecting to line login',
      };
    }

    return {
      accepted: true,
      credential: {
        os: liff.getOS(),
        language: liff.getLanguage(),
        version: liff.getVersion(),
        isInClient: liff.isInClient(),
        accessToken: liff.getAccessToken(),
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(data: LIFFAuthData) {
    return refineLIFFContextData(data);
  }
}

export default LineClientAuthProvider;
