// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import invariant from 'invariant';
import type { ClientAuthorizer, ContextSupplement } from '@machinat/auth/types';
import { MESSENGER } from '../constant';
import type {
  MessengerAuthCredential,
  MessengerAuthData,
  MessengerAuthContext,
  ExtensionContext,
  AuthorizerCredentialResult,
} from './types';
import { supplementContext } from './utils';

type MessengerClientAuthOpts = {
  appId: string;
  isExtensionReady?: boolean;
};

/** @ignore */
declare const window: Window & { extAsyncInit(): void };

/** @ignore */
declare const MessengerExtensions: any;

/** @ignore */
const INIT_TIMEOUT = 20000; // 20s;

class MessengerClientAuthorizer
  implements
    ClientAuthorizer<
      MessengerAuthCredential,
      MessengerAuthData,
      MessengerAuthContext
    > {
  appId: string;
  isExtensionReady: boolean;

  platform = MESSENGER;

  constructor(options: MessengerClientAuthOpts) {
    invariant(
      options?.appId,
      'options.appId is required to retrieve chat context'
    );
    const { appId, isExtensionReady = false } = options;

    this.appId = appId;
    this.isExtensionReady = isExtensionReady;
  }

  // eslint-disable-next-line class-methods-use-this
  async init(): Promise<void> {
    if (this.isExtensionReady) {
      return;
    }

    const initPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('extension initiation timeout'));
      }, INIT_TIMEOUT);

      const previousExtInitCallback = window.extAsyncInit;
      window.extAsyncInit = () => {
        resolve();
        clearTimeout(timeoutId);

        if (typeof previousExtInitCallback === 'function') {
          previousExtInitCallback();
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

  async fetchCredential(): Promise<AuthorizerCredentialResult> {
    try {
      const context: ExtensionContext = await new Promise((resolve, reject) => {
        MessengerExtensions.getContext(this.appId, resolve, reject);
      });

      return {
        success: true,
        credential: {
          signedRequest: context.signed_request,
          client: window.name === 'messenger_ref' ? 'messenger' : 'facebook',
        },
      };
    } catch (err) {
      return {
        success: false,
        code: 401,
        reason: err.message,
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async supplementContext(
    data: MessengerAuthData
  ): Promise<null | ContextSupplement<MessengerAuthContext>> {
    return supplementContext(data);
  }
}

export default MessengerClientAuthorizer;
