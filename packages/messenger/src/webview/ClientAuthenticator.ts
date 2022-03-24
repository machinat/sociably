/// <reference lib="DOM" />
import invariant from 'invariant';
import type { CheckDataResult } from '@machinat/auth';
import type { WebviewClientAuthenticator } from '@machinat/webview';
import { MESSENGER } from '../constant';
import MessengerChat from '../Chat';
import MessengerUser from '../User';
import MessengerUserProfile from '../UserProfile';
import type {
  MessengerAuthCredential,
  MessengerAuthData,
  MessengerAuthContext,
  ExtensionContext,
  AuthenticatorCredentialResult,
} from './types';
import { getAuthContextDetails } from './utils';

type MessengerClientAuthOpts = {
  appId: string;
  isSdkReady?: boolean;
};

declare const window: Window & {
  extAsyncInit(): void;
  MessengerExtensions: any;
};

const INIT_TIMEOUT = 20000; // 20s;

class MessengerClientAuthenticator
  implements
    WebviewClientAuthenticator<
      MessengerAuthCredential,
      MessengerAuthData,
      MessengerAuthContext
    >
{
  appId: string;
  isSdkReady: boolean;
  extensionsSdk: any;

  platform = MESSENGER;
  marshalTypes = [MessengerChat, MessengerUser, MessengerUserProfile];

  constructor(options: MessengerClientAuthOpts) {
    invariant(
      options?.appId,
      'options.appId is required to retrieve chat context'
    );
    const { appId, isSdkReady = false } = options;

    this.appId = appId;
    this.isSdkReady = isSdkReady;
  }

  // eslint-disable-next-line class-methods-use-this
  async init(): Promise<void> {
    if (!this.isSdkReady) {
      const initPromise = new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('extension initiation timeout'));
        }, INIT_TIMEOUT);

        const existedInitCallback = window.extAsyncInit;
        window.extAsyncInit = () => {
          resolve();
          clearTimeout(timeoutId);

          if (typeof existedInitCallback === 'function') {
            existedInitCallback();
          }
        };
      });

      // eslint-disable-next-line func-names
      (function (d, s, id) {
        if (d.getElementById(id)) return;
        const fjs: any = d.getElementsByTagName(s)[0];
        const js: any = d.createElement(s);
        js.id = id;
        js.src = '//connect.facebook.net/en_US/messenger.Extensions.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'script', 'Messenger');

      await initPromise;
    }

    this.extensionsSdk = window.MessengerExtensions;
  }

  async fetchCredential(): Promise<AuthenticatorCredentialResult> {
    try {
      const context: ExtensionContext = await new Promise((resolve, reject) => {
        this.extensionsSdk.getContext(this.appId, resolve, reject);
      });

      return {
        ok: true,
        credential: {
          signedRequest: context.signed_request,
          client: window.name === 'messenger_ref' ? 'messenger' : 'facebook',
        },
      };
    } catch (code) {
      return {
        ok: false,
        code: 401,
        reason: `Messenger extension error ${code}`,
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthData(
    data: MessengerAuthData
  ): CheckDataResult<MessengerAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(): boolean {
    this.extensionsSdk.requestCloseBrowser(
      () => {},
      () => {}
    );
    return true;
  }
}

export default MessengerClientAuthenticator;
