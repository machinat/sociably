// @flow
import { parse as parseURL } from 'url';
import { relative as getRelativePath } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import invariant from 'invariant';
import { verify as verifyJWT } from 'jsonwebtoken';
import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';
import AuthError from '../error';
import { SIGNATURE_COOKIE_KEY } from '../constant';
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

import { getCookies, checkDomainScope, checkPathScope } from './utils';
import { CookieSession, CookieSessionOperator } from './session';

type ServerAuthControllerOpts = {|
  providers: ServerAuthProvider<any, any>[],
  secret: string,
  authEntry: string,
  tokenAge?: number,
  authCookieAge?: number,
  dataCookieAge?: number,
  refreshPeriod?: number,
  domainScope?: string,
  pathScope?: string,
  sameSite?: 'Strict' | 'Lax' | 'None',
  dev?: boolean,
|};

const getSignature = (req: VerifiableRequest) => {
  const cookies = getCookies(req);
  return cookies ? cookies[SIGNATURE_COOKIE_KEY] : undefined;
};

const parseBody = async (req: IncomingMessage) => {
  try {
    const rawBody = await getRawBody(req);
    const body = JSON.parse(rawBody);

    if (typeof body !== 'object') {
      throw new AuthError(400, 'invalid body type');
    }

    return body;
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
  authEntry: string;

  _hostname: string;
  _pathname: string;

  _sessionOperator: CookieSessionOperator;

  constructor({
    secret,
    providers,
    authEntry,
    authCookieAge = 180, // 3 min
    dataCookieAge = 60, // 1 min
    tokenAge = 1800, // 30 min
    refreshPeriod = 86400, // 1 day
    domainScope,
    pathScope = '/',
    sameSite = 'None',
    dev = false,
  }: ServerAuthControllerOpts = {}) {
    invariant(secret, 'options.secret must not be empty');
    invariant(authEntry, 'options.authEntry must not be empty');
    invariant(
      providers && providers.length > 0,
      'options.providers must not be empty'
    );

    const entryURL = parseURL(authEntry);
    invariant(
      entryURL.protocol && entryURL.host,
      'invalid or incomplete authEntry url'
    );

    this._hostname = (entryURL.hostname: any);
    this._pathname = (entryURL.pathname: any);

    invariant(
      !domainScope || checkDomainScope(this._hostname, domainScope),
      'options.authEntry should be located under subdomain of options.domainScope'
    );

    invariant(
      checkPathScope(this._pathname, pathScope),
      'options.authEntry should be located under subpath of options.pathScope'
    );

    this.secret = secret;
    this.providers = providers;
    this.authEntry = authEntry;

    this._sessionOperator = new CookieSessionOperator({
      hostname: this._hostname,
      pathname: this._pathname,
      secret,
      authCookieAge,
      dataCookieAge,
      tokenAge,
      refreshPeriod,
      domainScope,
      pathScope,
      sameSite,
      dev,
    });
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
      respondAPIError(res, 403, 'path forbidden');
      return true;
    }

    if (subpath.slice(0, 2) === '..') {
      // not subpath of auth root
      return false;
    }

    // inner auth api for client controller
    if (subpath[0] === '_') {
      if (req.method !== 'POST') {
        respondAPIError(res, 405, 'method not allowed');
        return true;
      }

      if (subpath === '_sign') {
        await this._handleSignRequest(req, res);
      } else if (subpath === '_refresh') {
        await this._handleRefreshRequest(req, res);
      } else if (subpath === '_verify') {
        await this._handleVerifyRequest(req, res);
      } else {
        respondAPIError(res, 404, `invalid auth api route "${subpath}"`);
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
      await provider.delegateAuthRequest(
        req,
        res,
        new CookieSession(req, res, platform, this._sessionOperator)
      );
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
    const signature = getSignature(req);
    if (!signature) {
      throw new AuthError(401, 'require signature');
    }

    let token = tokenProvided;
    if (!token) {
      const { authorization } = req.headers;
      if (!authorization) {
        throw new AuthError(401, 'no Authorization header');
      }

      const [scheme, tokenFromHeader] = authorization.split(/\s+/, 2);
      if (scheme !== 'Bearer' || !tokenFromHeader) {
        throw new AuthError(400, 'invalid auth scheme');
      }
      token = tokenFromHeader;
    }

    const { platform, auth, exp, iat } = await this._verifyToken(
      token,
      signature
    );

    const provider = this._getProviderOf(platform);
    if (!provider) {
      throw new AuthError(404, `unknown platform "${platform}"`);
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
    try {
      const { platform, credential }: SignRequestBody<any> = await parseBody(
        req
      );
      if (!platform || !credential) {
        respondAPIError(res, 400, 'invalid sign params');
        return;
      }

      const provider = this._getProviderOf(platform);
      if (!provider) {
        respondAPIError(res, 404, `unknown platform "${platform}"`);
        return;
      }

      const verifyResult = await provider.verifySigning(credential);
      if (!verifyResult.accepted) {
        const { code, message } = verifyResult;
        respondAPIError(res, code, message);
        return;
      }

      const { data, refreshable } = verifyResult;
      const token = await this._sessionOperator.issueAuth(res, platform, data, {
        refreshable,
        signatureOnly: true,
      });

      respondAPIOk(res, platform, token);
    } catch (err) {
      respondAPIError(res, err.code || 500, err.message);
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
      if (!token) {
        respondAPIError(res, 400, 'empty token received');
        return;
      }

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
          respondAPIError(res, 404, `unknown platform "${platform}"`);
          return;
        }

        const verifyResult = await provider.verifyRefreshment(auth);
        if (!verifyResult.accepted) {
          const { code, message } = verifyResult;
          respondAPIError(res, code, message);
          return;
        }

        const { data } = verifyResult;
        const newToken = await this._sessionOperator.issueAuth(
          res,
          platform,
          data,
          { refreshLimit, refreshable: true, signatureOnly: true }
        );
        respondAPIOk(res, platform, newToken);
      } else {
        respondAPIError(res, 401, 'token refreshment period outdated');
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
      if (!token) {
        respondAPIError(res, 400, 'empty token received');
        return;
      }

      const { platform } = await this._verifyToken(token, signature);
      const provider = this._getProviderOf(platform);
      if (!provider) {
        respondAPIError(res, 404, `unknown platform "${platform}"`);
        return;
      }

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
      throw new AuthError(401, err.message);
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
