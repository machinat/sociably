// @flow
import { parse as parseURL } from 'url';
import {
  isAbsolute as isAbsolutePath,
  relative as getRelativePath,
} from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import invariant from 'invariant';
import { verify as verifyJWT } from 'jsonwebtoken';
import { decode as decodeBase64URL } from 'base64url';
import thenifiedly from 'thenifiedly';

import {
  AUTH_SCHEME,
  TOKEN_SIGNATURE_COOKIE_KEY,
  TOKEN_CONTENT_COOKIE_KEY,
} from '../constant';
import type {
  ServerAuthProvider,
  AuthContext,
  AuthData,
  AuthPayload,
} from '../types';

import { respondError, getCookies, checkDomainScope } from './utils';
import AuthFlowHelper from './helper';

type FlowControllerOptions = {|
  providers: ServerAuthProvider[],
  secret: string,
  entry: string,
  tokenAge: number,
  cookieAge: number,
  scopeDomain?: string,
  scopePath: string,
  sameSiteStrict: boolean,
  dev: boolean,
|};

type FlowControllerOptionsInput = $Shape<FlowControllerOptions>;

type SignedAuthParams = {|
  signed: true,
  platform: string,
  token_content: string,
|};

type UnsignedAuthParam = {|
  signed: false,
  platform: string,
  auth_data: any,
|};

type HTTPAuthorizationParams = SignedAuthParams | UnsignedAuthParam;

// Auhtorization: Machinat-Auth platfrom=telegram,signed=true,token_content=xxx
// Auhtorization: Machinat-Auth platfrom=messenger,signed=false,auth_data=xxxx
const allowedAuthorizationFields = [
  'platfrom',
  'signed',
  'token_content',
  'auth_data',
];

const parseAuthParams = (paramsStr: string): null | HTTPAuthorizationParams => {
  const pairs = paramsStr.split(/\s*,\s*/);
  if (pairs.length === 0) {
    return null;
  }

  const params = {};
  for (const pair of pairs) {
    const [key, value] = pair.split('=', 2);

    if (
      !key ||
      !allowedAuthorizationFields.includes(key) ||
      value === undefined
    ) {
      return null;
    }

    params[key] = value;
  }

  const polished: any = {};

  if (params.signed === 'true') {
    if (!params.token_content) {
      return null;
    }

    polished.signed = true;
    polished.tokenContent = params.token_content;
  } else if (params.signed === 'false') {
    if (!params.auth_data || !params.platform) {
      return null;
    }

    polished.signed = true;
    polished.platform = params.platform;
    try {
      polished.authData = JSON.parse(decodeBase64URL(params.auth_data));
    } catch (e) {
      return null;
    }
  } else {
    return null;
  }

  return polished;
};

class AuthFlowController {
  options: FlowControllerOptions;
  _hostname: string;
  _pathname: string;

  _helper: AuthFlowHelper;

  constructor(optionsInput: FlowControllerOptionsInput) {
    const defaultOpts: FlowControllerOptionsInput = {
      secret: undefined,
      providers: undefined,
      entry: undefined,
      tokenAge: 844000, // 10 day
      cookieAge: 600, // 10 min
      scopeDomain: undefined,
      scopePath: '/',
      sameSiteStrict: false,
      dev: false,
    };

    const options = Object.assign(defaultOpts, optionsInput);

    invariant(options.secret, 'options.secret must not be empty');
    invariant(options.entry, 'options.entry must not be empty');
    invariant(
      options.providers && options.providers.length > 0,
      'options.providers must not be empty'
    );

    const entryURL = parseURL(options.entry);
    invariant(
      entryURL.protocol && entryURL.host,
      'invalid or incomplete auth entry'
    );

    invariant(
      !options.scopeDomain ||
        checkDomainScope((entryURL.hostname: any), options.scopeDomain),
      'options.entry should be located under options.scopeDomain'
    );

    this._hostname = (entryURL.hostname: any);
    this._pathname = (entryURL.pathname: any);

    invariant(
      isAbsolutePath(options.scopePath),
      'options.scopePath should be an absolute path'
    );

    this._helper = new AuthFlowHelper(
      this._hostname,
      this._pathname,
      this.options.tokenAge,
      this.options.cookieAge,
      this.options.scopeDomain,
      this.options.scopePath,
      this.options.sameSiteStrict,
      this.options.dev
    );
  }

  async delegateAuthRequest(req: IncomingMessage, res: ServerResponse) {
    const urlObj = parseURL(req.url, true);
    const subpath = getRelativePath(this._pathname, urlObj.pathname || '/');

    if (subpath === '' || subpath.slice(0, 2) === '..') {
      respondError(
        res,
        403,
        'path not allowed, must be in the form of /{auth_entry}/{platform}/*'
      );
    }

    const [platform] = subpath.split('/');

    const provider = this._getProviderOf(platform);
    if (!provider) {
      respondError(res, 404, `platform "${platform}" not found`);
      return;
    }

    await provider.handleAuthRequest(req, res, this._helper);
  }

  async verifyHTTPAuthorization(
    req: IncomingMessage
  ): Promise<null | AuthContext> {
    const { authorization } = req.headers;
    if (!authorization) {
      return null;
    }

    const [scheme, rawParams] = (authorization: string).split(/\s+/, 2);
    if (scheme.toLowerCase() !== AUTH_SCHEME || !rawParams) {
      return null;
    }

    const params = parseAuthParams(rawParams);
    if (!params) {
      return null;
    }

    if (!params.signed) {
      const { platform, auth_data: authData } = params;
      if (!authData) {
        return null;
      }

      return this._verifyAuthData(platform, authData);
    }

    const { token_content: tokenContent } = params;
    if (!tokenContent) {
      return null;
    }

    const cookies = getCookies(req);

    let signature;
    if (
      !cookies ||
      !tokenContent ||
      !(signature = cookies[TOKEN_SIGNATURE_COOKIE_KEY])
    ) {
      return null;
    }

    return this._verifyToken(tokenContent, signature);
  }

  refreshAuthCookie(req: IncomingMessage, res: ServerResponse) {
    const cookies = getCookies(req);
    if (!cookies) {
      return;
    }

    let tokenContent;
    let signature;

    if (
      !(
        (tokenContent = cookies[TOKEN_CONTENT_COOKIE_KEY]) &&
        (signature = cookies[TOKEN_SIGNATURE_COOKIE_KEY])
      )
    ) {
      if (tokenContent) {
        this._helper.deleteCookie(res, TOKEN_CONTENT_COOKIE_KEY);
      }
      if (signature) {
        this._helper.deleteCookie(res, TOKEN_SIGNATURE_COOKIE_KEY);
      }
      return;
    }

    if (this._verifyToken(tokenContent, signature)) {
      this._helper.setDataCookie(res, TOKEN_CONTENT_COOKIE_KEY, tokenContent);
      return;
    }

    this._helper.deleteCookie(res, TOKEN_CONTENT_COOKIE_KEY);
    this._helper.deleteCookie(res, TOKEN_SIGNATURE_COOKIE_KEY);
  }

  async _verifyAuthData(
    platform: string,
    data: AuthData
  ): Promise<null | AuthContext> {
    const provider = this._getProviderOf(platform);
    if (!provider) {
      return null;
    }

    const passed = await provider.verifyAuthData(data);
    if (!passed) {
      return null;
    }

    return provider.unmarshalAuthData(data);
  }

  async _verifyToken(
    tokenContent: string,
    signature: string
  ): Promise<null | AuthContext> {
    let authPayload;
    try {
      authPayload = await thenifiedly.call(
        verifyJWT,
        `${tokenContent}.${signature}`,
        this.options.secret
      );
    } catch (e) {
      return null;
    }

    const { platform, auth }: AuthPayload = authPayload;
    const provider = this._getProviderOf(platform);
    if (!provider) {
      return null;
    }

    return provider.unmarshalAuthData(auth);
  }

  _getProviderOf(platform: string): null | ServerAuthProvider {
    for (const provider of this.options.providers) {
      if (platform === provider.platform) {
        return provider;
      }
    }

    return null;
  }
}

export default AuthFlowController;
