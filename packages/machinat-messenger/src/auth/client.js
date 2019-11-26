// @flow
import invariant from 'invariant';
import type { ClientAuthProvider } from 'machinat-auth/types';
import { MESSENGER } from '../constant';
import type { ExtensionContext, ExtensionCredential } from '../types';
import { refineExtensionContext } from './utils';

type MessengerClientAuthOpts = {
  appId: string,
  isExtensionReady?: boolean,
};

declare var document: Document;
declare var window: Object;
declare var MessengerExtensions: Object;

const INIT_TIMEOUT = 20000;

class MessengerClientAuthProvider
  implements ClientAuthProvider<ExtensionContext, ExtensionCredential> {
  appId: string;
  isExtensionReady: boolean;

  platform = MESSENGER;

  constructor({
    appId,
    isExtensionReady = false,
  }: MessengerClientAuthOpts = {}) {
    invariant(appId, 'options.appId is required to retrieve chat context');

    this.appId = appId;
    this.isExtensionReady = isExtensionReady;
  }

  // eslint-disable-next-line class-methods-use-this
  async init() {
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
    (function(d, s, id) {
      if (d.getElementById(id)) return;
      const fjs: any = d.getElementsByTagName(s)[0];
      const js: any = d.createElement(s);
      js.id = id;
      js.src = '//connect.facebook.net/en_US/messenger.Extensions.js';
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'Messenger');

    await initPromise;
  }

  async startAuthFlow() {
    try {
      const context = await new Promise((resolve, reject) => {
        MessengerExtensions.getContext(this.appId, resolve, reject);
      });

      return {
        accepted: true,
        credential: { signedRequest: context.signed_request },
      };
    } catch (err) {
      return {
        accepted: false,
        code: 401,
        message: err.message,
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(context: ExtensionContext) {
    return refineExtensionContext(context);
  }
}

export default MessengerClientAuthProvider;
