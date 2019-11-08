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
import AuthError from '../error';

import {
  AUTH_SCHEME,
  TOKEN_SIGNATURE_COOKIE_KEY,
  TOKEN_CONTENT_COOKIE_KEY,
} from '../constant';
import type {
  ServerAuthProvider,
  AuthResult,
  AuthContext,
  AuthPayload,
} from '../types';

import { respondError, getCookies, checkDomainScope } from './utils';
import AuthFlowHelper from './helper';

type FlowControllerOptions = {|
  providers: ServerAuthProvider<any>[],
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

type SelfIssuedAuthParams = {|
  platform: string,
  self_issued: true,
  token_content: string,
|};

type NonSelfIssuedAuthParam = {|
  platform: string,
  self_issued: false,
  auth_data: any,
|};

type HTTPAuthorizationParams = SelfIssuedAuthParams | NonSelfIssuedAuthParam;

// Auhtorization: Machinat-Auth-V0 platfrom=telegram,self_issued=true,token_content=xxx
// Auhtorization: Machinat-Auth platfrom=messenger,self_issued=false,auth_data=xxxx
const allowedAuthorizationFields = [
  'platfrom',
  'self_issued',
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

  if (params.self_issued === 'true') {
    if (!params.token_content || !params.platform) {
      return null;
    }

    return {
      self_issued: true,
      platform: params.platform,
      token_content: params.token_content,
    };
  }

  if (params.self_issued === 'false') {
    if (!params.auth_data || !params.platform) {
      return null;
    }

    try {
      return {
        self_issued: false,
        platform: params.platform,
        auth_data: JSON.parse(decodeBase64URL(params.auth_data)),
      };
    } catch (e) {
      return null;
    }
  }

  return null;
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
  ): Promise<AuthContext<any>> {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new AuthError(401, '"Authorization" header required');
    }

    const [scheme, rawParams] = (authorization: string).split(/\s+/, 2);
    if (scheme.toLowerCase() !== AUTH_SCHEME || !rawParams) {
      throw new AuthError(400, 'unknown auth scheme');
    }

    const params = parseAuthParams(rawParams);
    if (!params) {
      throw new AuthError(400, 'invalid authorization params');
    }

    if (!params.self_issued) {
      const { platform, auth_data: authData } = params;
      if (!authData) {
        throw new AuthError(400, 'invalid authorization params');
      }

      const provider = this._getProviderOf(platform);
      if (!provider) {
        throw new AuthError(404, 'unknown platform');
      }

      try {
        const result = await provider.verifyAuthData(authData);
        const { channel, user, loginAt, data } = result;

        return {
          selfIssued: false,
          platform,
          channel,
          user,
          loginAt,
          data,
        };
      } catch (err) {
        if (typeof err.code !== 'number') {
          throw new AuthError(500, err.message);
        }
        throw err;
      }
    }

    const { platform, token_content: tokenContent } = params;
    if (!tokenContent) {
      throw new AuthError(400, 'invalid authorization params');
    }

    const cookies = getCookies(req);
    let signature;
    if (!cookies || !(signature = cookies[TOKEN_SIGNATURE_COOKIE_KEY])) {
      throw new AuthError(401, 'signature required');
    }

    const result = await this._verifyToken(tokenContent, signature);
    const { channel, user, loginAt, data } = result;

    return {
      selfIssued: true,
      platform,
      channel,
      user,
      loginAt,
      data,
    };
  }

  async refreshAuthCookie(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    const cookies = getCookies(req);
    if (!cookies) {
      return false;
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
      return false;
    }

    try {
      this._verifyToken(tokenContent, signature);
    } catch (e) {
      this._helper.deleteCookie(res, TOKEN_CONTENT_COOKIE_KEY);
      this._helper.deleteCookie(res, TOKEN_SIGNATURE_COOKIE_KEY);
      return false;
    }

    this._helper.setDataCookie(res, TOKEN_CONTENT_COOKIE_KEY, tokenContent);
    return true;
  }

  async _verifyToken(
    tokenContent: string,
    signature: string
  ): Promise<AuthResult<any>> {
    let authPayload;
    try {
      authPayload = await thenifiedly.call(
        verifyJWT,
        `${tokenContent}.${signature}`,
        this.options.secret
      );
    } catch (err) {
      throw new AuthError(403, err.message);
    }

    const { platform, auth }: AuthPayload<any> = authPayload;
    const provider = this._getProviderOf(platform);
    if (!provider) {
      throw new AuthError(404, 'unknown platform');
    }

    const context = await provider.refineAuthData(auth);
    if (!context) {
      throw new AuthError(400, 'invalid auth data');
    }

    return context;
  }

  _getProviderOf(platform: string): null | ServerAuthProvider<any> {
    for (const provider of this.options.providers) {
      if (platform === provider.platform) {
        return provider;
      }
    }

    return null;
  }
}

export default AuthFlowController;
