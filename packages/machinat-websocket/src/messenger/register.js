// @flow
import invariant from 'invariant';
import { MESSENGER_CHAT_EXTENSION } from './constant';

declare var MessengerExtensions: any;
declare var window: any;

type RegisterChatExtensionOptions = {
  appId: string,
  isExtensionReady: boolean,
  initTimeout: number,
};

type RegisterChatExtensionOptionsInput = $Shape<RegisterChatExtensionOptions>;

const registerChatExtension = (
  optionsInput?: RegisterChatExtensionOptionsInput
) => {
  const defaultOptions: RegisterChatExtensionOptionsInput = {
    isExtensionReady: false,
    initTimeout: 30000,
  };

  const options = Object.assign(defaultOptions, optionsInput);

  invariant(options.appId, 'appId is required to retrieve chat context');

  let initPromise;
  if (!options.isExtensionReady) {
    initPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('extension initiation timeout'));
      }, options.initTimeout);

      window.extAsyncInit = () => {
        clearTimeout(timeoutId);
        resolve();
      };
    });
  }

  return async () => {
    if (initPromise) {
      await initPromise;
    }

    const context = await new Promise((resolve, reject) => {
      MessengerExtensions.getContext(options.appId, resolve, reject);
    });

    return {
      type: MESSENGER_CHAT_EXTENSION,
      signedRequest: context.signed_request,
    };
  };
};

export default registerChatExtension;
