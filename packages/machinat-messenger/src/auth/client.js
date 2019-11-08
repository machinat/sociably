// @flow
import invariant from 'invariant';
import type { AuthData, ClientAuthProvider } from 'machinat-auth/types';
import { MESSENGER } from '../constant';
import type { ExtensionContext } from '../types';
import { refineExtensionContext, refineExtensionContextSafely } from './utils';

type MessengerClientAuthOpts = {
  appId: string,
  isExtensionReady: boolean,
  initTimeout: number,
};

type MessengerClientAuthOptsInput = $Shape<MessengerClientAuthOpts>;

declare var document: any;
declare var window: any;
declare var MessengerExtensions: any;

class MessengerClientAuthProvider
  implements ClientAuthProvider<ExtensionContext> {
  options: MessengerClientAuthOpts;
  _initPromise: void | Promise<void>;

  platform = MESSENGER;

  constructor(options: MessengerClientAuthOptsInput) {
    invariant(
      options && options.appId,
      'options.appId is required to retrieve chat context'
    );

    const dafaultOpts: MessengerClientAuthOptsInput = {
      isExtensionReady: false,
      initTimeout: 20000,
    };

    this.options = Object.assign(dafaultOpts, options);
  }

  // eslint-disable-next-line class-methods-use-this
  init(): void {
    if (this.options.isExtensionReady) {
      return;
    }

    this._initPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('extension initiation timeout'));
      }, this.options.initTimeout);

      const previousExtInitCallback = window.extAsyncInit;
      window.extAsyncInit = () => {
        clearTimeout(timeoutId);
        resolve();

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
  }

  async startAuthFlow() {
    if (this._initPromise) {
      await this._initPromise;
    }

    const context = await new Promise((resolve, reject) => {
      MessengerExtensions.getContext(this.options.appId, resolve, reject);
    });

    return refineExtensionContext(context);
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuthData({ data: context }: AuthData<ExtensionContext>) {
    return refineExtensionContextSafely(context);
  }
}

export default MessengerClientAuthProvider;
