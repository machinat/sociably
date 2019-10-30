// @flow
import invariant from 'invariant';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { encode as encodeBase64URL } from 'base64url';
import { decode as decodeJWT } from 'jsonwebtoken';
import {
  AUTH_SCHEME,
  TOKEN_CONTENT_COOKIE_KEY,
  ERROR_COOKIE_KEY,
} from '../constant';
import type {
  AuthContext,
  ClientAuthProvider,
  AuthPayload,
  ErrorPayload,
} from '../types';

type ClientFlowControllerOpts = {|
  authEntry?: string,
  providers: ClientAuthProvider[],
|};

type AuthResult = {
  context: AuthContext,
  credential: string,
};

declare var location: Location;
declare var document: Document;

const signedCredential = (platform: string, tokenContent: string) =>
  `${AUTH_SCHEME} signed=true,platform=${platform},token_content=${tokenContent}`;

const unsignedCredential = (platform: string, authData: any) =>
  `${AUTH_SCHEME} signed=false,platform=${platform},auth_data=${encodeBase64URL(
    JSON.stringify(authData)
  )}`;

const deleteCookie = (name: string, domain?: string, path?: string) => {
  document.cookie = serializeCookie(name, '', {
    expires: new Date(0),
    domain,
    path,
  });
};

class ClientFlowController {
  providers: ClientAuthProvider[];
  authEntry: string;
  initiated: boolean;
  _cookies: {| [string]: string |};

  constructor(options: ClientFlowControllerOpts) {
    invariant(
      options && options.providers && options.providers.length > 0,
      'options.providers must not be empty'
    );

    this.providers = options.providers;
    this.authEntry = options.authEntry || '/auth';
    this.initiated = false;
    this._cookies = parseCookie(document.cookie);
  }

  /**
   * Call provider.init() of the specified platform if not yet signed.
   */
  init() {
    this.initiated = true;

    if (
      this._cookies[TOKEN_CONTENT_COOKIE_KEY] ||
      this._cookies[ERROR_COOKIE_KEY]
    ) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const platform = params.get('platform');
    if (!platform) {
      return;
    }

    const provider = this._getProviderOf(platform);
    if (!provider) {
      return;
    }

    provider.init();
  }

  /**
   * Resolve the auth context already assigned or context resolved by
   * provider.startFlow(), reject if error happen.
   */
  async authenticate(): Promise<AuthResult> {
    const params = new URLSearchParams(location.search);
    const platformSpecified = params.get('platform');

    if (this._cookies[ERROR_COOKIE_KEY]) {
      // if error payload exist, throw it and delete from cookie
      const payload: ErrorPayload = decodeJWT(this._cookies[ERROR_COOKIE_KEY]);

      const { platform: errorPlatform, scope, error } = payload;
      deleteCookie(ERROR_COOKIE_KEY, scope.domain, scope.path);

      if (!platformSpecified || errorPlatform === platformSpecified) {
        throw new Error();
      }
    }

    let authPayload: void | AuthPayload;
    if (this._cookies[TOKEN_CONTENT_COOKIE_KEY]) {
      authPayload = decodeJWT(`${this._cookies[TOKEN_CONTENT_COOKIE_KEY]}.`);

      const {
        platform: authPlatform,
        auth: authData,
        exp: expireAt,
      } = authPayload;

      const provider = this._getProviderOf(authPlatform);
      if (!provider) {
        throw new Error();
      }

      // use auth payload from cookie if it's valid
      if (
        (!platformSpecified || platformSpecified === authPlatform) &&
        (!expireAt || expireAt > Date.now() / 1000)
      ) {
        return {
          credential: signedCredential(authPlatform, authData),
          context: provider.unmarshalAuthData(authData),
        };
      }
    }

    // throw if no auth payload nor platform specified
    if (!platformSpecified && !authPayload) {
      throw new Error();
    }

    const platform: string = platformSpecified || (authPayload: any).platform;
    const provider = this._getProviderOf(platform);
    if (!provider) {
      throw new Error();
    }

    const authData = provider.startFlow(`${this.authEntry}/${platform}`);
    return {
      credential: unsignedCredential(platform, authData),
      context: provider.unmarshalAuthData(authData),
    };
  }

  _getProviderOf(platform: string) {
    const provider = this.providers.find(p => p.platform === platform);
    return provider || null;
  }
}

export default ClientFlowController;
