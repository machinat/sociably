// @flow
import { parse as parseURL } from 'url';
import {
  isAbsolute as isAbsolutePath,
  relative as getRelativePath,
} from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import invariant from 'invariant';
import { verify as verifyJWT } from 'jsonwebtoken';
import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';
import AuthError from '../error';
import { TOKEN_SIGNATURE_COOKIE_KEY } from '../constant';
import type {
  ServerAuthProvider,
  AuthContext,
  AuthTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthAPIResponseBody,
  VerifiableRequest,
} from '../types';

import { getCookies, checkDomainScope } from './utils';
import AuthCookieSession from './session';

type ServerAuthControllerOpts = {|
  providers: ServerAuthProvider<any, any>[],
  secret: string,
  entry: string,
  cookieAge?: number,
  refreshPeriod?: number,
  tokenAge?: number,
  scopeDomain?: string,
  scopePath?: string,
  sameSite?: 'Strict' | 'Lax' | 'None',
  dev?: boolean,
|};

const getSignature = (req: VerifiableRequest) => {
  const cookies = getCookies(req);
  return cookies ? cookies[TOKEN_SIGNATURE_COOKIE_KEY] : undefined;
};

const parseBody = async (req: IncomingMessage) => {
  try {
    const rawBody = await getRawBody(req);
    return JSON.parse(rawBody);
  } catch (err) {
    throw new AuthError(400, err.message);
  }
};

const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

const respondAPIOk = (res: ServerResponse, platform: string, token: string) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  res.end(JSON.stringify(({ platform, token }: AuthAPIResponseBody)));
};

const respondAPIError = (
  res: ServerResponse,
  code: number,
  message: string
) => {
  res.writeHead(code, CONTENT_TYPE_JSON);
  res.end(JSON.stringify({ error: { code, message } }));
};

class AuthServerController {
  providers: ServerAuthProvider<any, any>[];
  secret: string;
  entry: string;

  _hostname: string;
  _pathname: string;

  session: AuthCookieSession;

  constructor({
    secret,
    providers,
    entry,
    cookieAge = 180, // 3 min
    tokenAge = 1800, // 30 min
    refreshPeriod = 86400, // 1 day
    scopeDomain,
    scopePath = '/',
    sameSite = 'None',
    dev = false,
  }: ServerAuthControllerOpts = {}) {
    invariant(secret, 'options.secret must not be empty');
    invariant(entry, 'options.entry must not be empty');
    invariant(
      providers && providers.length > 0,
      'options.providers must not be empty'
    );

    const entryURL = parseURL(entry);
    invariant(
      entryURL.protocol && entryURL.host,
      'invalid or incomplete auth entry'
    );

    invariant(
      !scopeDomain || checkDomainScope((entryURL.hostname: any), scopeDomain),
      'options.entry should be located under options.scopeDomain'
    );

    this._hostname = (entryURL.hostname: any);
    this._pathname = (entryURL.pathname: any);

    invariant(
      isAbsolutePath(scopePath),
      'options.scopePath should be an absolute path'
    );

    this.secret = secret;
    this.providers = providers;
    this.entry = entry;

    this.session = new AuthCookieSession(
      this._hostname,
      secret,
      cookieAge,
      tokenAge,
      refreshPeriod,
      scopeDomain,
      scopePath,
      sameSite,
      dev
    );
  }

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    const { hostname, pathname } = parseURL(req.url, true);

    if (hostname && hostname !== this._hostname) {
      return false;
    }

    const subpath = getRelativePath(this._pathname, pathname || '/');

    if (subpath === '') {
      // directly called on auth root
      respondAPIError(res, 404, 'invalid pathname');
      return true;
    }

    if (subpath.slice(0, 2) === '..') {
      // not subpath of auth root
      return false;
    }

    // inner auth api for client controller
    if (subpath[0] === '_') {
      if (req.method !== 'POST') {
        respondAPIError(res, 405, 'only POST method allowed');
        return true;
      }

      if (subpath === '_sign') {
        this._handleSignRequest(req, res);
      } else if (subpath === '_refresh') {
        this._handleRefreshRequest(req, res);
      } else if (subpath === '_verify') {
        this._handleVerifyRequest(req, res);
      } else {
        respondAPIError(res, 404, 'unknown auth api');
      }
      return true;
    }

    const [platform] = subpath.split('/');

    const provider = this._getProviderOf(platform);
    if (!provider) {
      respondAPIError(res, 404, `platform "${platform}" not found`);
      return true;
    }

    // delegate requests of platform specified flow to provider
    try {
      await provider.delegateAuthRequest(req, res, this.session);
    } catch (err) {
      if (!res.finished) {
        respondAPIError(res, err.code || 500, err.message);
      }
      return true;
    }

    if (!res.finished) {
      respondAPIError(res, 501, 'connection not closed by provider');
    }

    return true;
  }

  async verifyHTTPAuthorization(
    req: VerifiableRequest,
    tokenProvided?: string
  ): Promise<AuthContext<any>> {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new AuthError(401, 'no Authorization header');
    }

    const signature = getSignature(req);
    if (!signature) {
      throw new AuthError(401, 'require signature');
    }

    let token = tokenProvided;
    if (!token) {
      const [scheme, tokenFromHeader] = (authorization: string).split(/\s+/, 2);
      if (scheme !== 'Bearer' || !token) {
        throw new AuthError(400, 'unknown auth scheme');
      }
      token = tokenFromHeader;
    }

    const { platform, auth, exp, iat } = await this._verifyToken(
      token,
      signature
    );

    const provider = this._getProviderOf(platform);
    if (!provider) {
      throw new AuthError(404, 'unknown platform');
    }

    const result = await provider.refineAuth(auth);
    if (!result) {
      throw new AuthError(400, 'invalid auth data');
    }

    const { channel, user } = result;
    return {
      platform,
      channel,
      user,
      data: auth,
      loginAt: new Date(iat * 1000),
      expireAt: new Date(exp * 1000),
    };
  }

  async _handleSignRequest(req: IncomingMessage, res: ServerResponse) {
    const { platform, credential }: SignRequestBody<any> = await parseBody(req);

    try {
      const provider = this._getProviderOf(platform);
      if (!provider) {
        throw new AuthError(401, 'platform not found');
      }

      const verifyResult = await provider.verifySigning(credential);
      if (!verifyResult.accepted) {
        const { code, message } = verifyResult;
        throw new AuthError(code, message);
      }

      const { data, refreshable } = verifyResult;
      const token = await this.session.issueAuth(
        res,
        platform,
        data,
        undefined,
        refreshable,
        true
      );

      respondAPIOk(res, platform, token);
    } catch (err) {
      respondAPIError(res, err.code, err.message);
    }
  }

  async _handleRefreshRequest(req: IncomingMessage, res: ServerResponse) {
    // get signature from cookie
    const signature = getSignature(req);
    if (!signature) {
      respondAPIError(res, 401, 'no signature found');
      return;
    }

    try {
      // verify token in body ignoring expiration
      const { token }: RefreshRequestBody = await parseBody(req);
      const payload = await this._verifyToken(token, signature, {
        ignoreExpiration: true,
      });

      const { refreshLimit, platform, auth } = payload;
      if (!refreshLimit) {
        respondAPIError(res, 400, 'token not refreshable');
        return;
      }

      if (refreshLimit * 1000 >= Date.now()) {
        // refresh signature and issue new token
        const provider = this._getProviderOf(platform);
        if (!provider) {
          throw new AuthError(401, 'platform not found');
        }

        const verifyResult = await provider.verifyRefreshment(auth);
        if (!verifyResult.accepted) {
          const { code, message } = verifyResult;
          throw new AuthError(code, message);
        }

        const { data } = verifyResult;
        const newToken = await this.session.issueAuth(
          res,
          platform,
          data,
          refreshLimit,
          true,
          true
        );
        respondAPIOk(res, platform, newToken);
      } else {
        // if refreshment period expired
        this.session.clearCookies(res);
        respondAPIError(res, 401, 'token refreshment period expired');
      }
    } catch (err) {
      respondAPIError(res, err.code || 500, err.message);
    }
  }

  async _handleVerifyRequest(req: IncomingMessage, res: ServerResponse) {
    // get signature from cookie
    const signature = getSignature(req);
    if (!signature) {
      respondAPIError(res, 401, 'no signature found');
      return;
    }

    try {
      // verify token in body
      const { token }: VerifyRequestBody = await parseBody(req);
      const payload = await this._verifyToken(token, signature);
      const { platform } = payload;

      respondAPIOk(res, platform, token);
    } catch (err) {
      respondAPIError(res, err.code || 500, err.message);
    }
  }

  async _verifyToken(
    token: string,
    signature: string,
    jwtVerifyOpts?: Object
  ): Promise<AuthTokenPayload<any>> {
    let payload: AuthTokenPayload<any>;
    try {
      payload = await thenifiedly.call(
        verifyJWT,
        `${token}.${signature}`,
        this.secret,
        jwtVerifyOpts
      );
    } catch (err) {
      throw new AuthError(400, err.message);
    }

    const provider = this._getProviderOf(payload.platform);
    if (!provider) {
      throw new AuthError(404, 'unknown platform');
    }

    return payload;
  }

  _getProviderOf(platform: string): null | ServerAuthProvider<any, any> {
    for (const provider of this.providers) {
      if (platform === provider.platform) {
        return provider;
      }
    }
    return null;
  }
}

export default AuthServerController;
