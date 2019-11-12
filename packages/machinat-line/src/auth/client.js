// @flow
import invariant from 'invariant';
import type { AuthData, ClientAuthProvider } from 'machinat-auth/types';
import { LINE } from '../constant';
import { LineUser } from '../user';
import type { LIFFAuthData, RawLineUserProfile } from '../types';
import { refineLIFFContextData } from './utils';

declare var document: Document;
declare var liff: Object;

type ClientAuthProviderOpts = {
  channelId: string,
  liffId: string,
  isSDKLoaded: boolean,
};

type ClientAuthProviderOptsInput = $Shape<ClientAuthProviderOpts>;

const LIFF = 'LIFF';

const LOGIN_TIMEOUT = 10000;

const loginIfNeeded = () => {
  if (!liff.isLoggedIn()) {
    liff.login();
    // throw if not redirected in LOGIN_TIMEOUT
    return new Promise((_, reject) => {
      setTimeout(
        reject,
        LOGIN_TIMEOUT,
        new Error('timeout for redirecting to line login')
      );
    });
  }

  return Promise.resolve();
};

class LineClientAuthProvider implements ClientAuthProvider<LIFFAuthData> {
  options: ClientAuthProviderOpts;
  _initPromise: void | Promise<void>;

  platform = LINE;

  constructor(options: ClientAuthProviderOptsInput) {
    invariant(options && options.liffId, 'options.liffId must not be empty');
    invariant(options.channelId, 'options.channelId must not be empty');

    const defaultOpts: ClientAuthProviderOptsInput = { isSDKLoaded: false };
    this.options = Object.assign(defaultOpts, options);
  }

  init() {
    const { liffId } = this.options;

    if (this.options.isSDKLoaded) {
      this._initPromise = liff.init({ liffId }).then(loginIfNeeded);
      return;
    }

    if (document.getElementById(LIFF)) {
      return;
    }

    const SCRIPT = 'script';
    const js = document.createElement(SCRIPT);
    js.id = LIFF;
    js.src = 'https://static.line-scdn.net/liff/edge/2.1/sdk.js';
    js.onload = () => {
      this._initPromise = liff.init({ liffId }).then(loginIfNeeded);
    };

    const fjs: any = document.getElementsByTagName(SCRIPT)[0];
    fjs.parentNode.insertBefore(js, fjs);
  }

  async startAuthFlow() {
    if (this._initPromise) {
      await this._initPromise;
    }

    const profile: RawLineUserProfile = await liff.getProfile();
    const now = new Date();

    return {
      channel: null,
      user: new LineUser(this.options.channelId, profile.userId),
      data: {
        os: liff.getOS(),
        language: liff.getLanguage(),
        version: liff.getVersion(),
        isInClient: liff.isInClient(),
        idLoggedIn: liff.isLoggedIn(),
        accessToken: liff.getAccessToken(),
        profile,
        loginTime: now.valueOf(),
      },
      loginAt: now,
    };
  }

  async refineAuthData({ data }: AuthData<LIFFAuthData>) {
    return refineLIFFContextData(this.options.channelId, data);
  }
}

export default LineClientAuthProvider;
