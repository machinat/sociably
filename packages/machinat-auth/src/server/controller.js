// @flow
import { provider } from '@machinat/core/service';
import { parse as parseURL } from 'url';
import { relative as getRelativePath } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import invariant from 'invariant';
import { verify as verifyJWT } from 'jsonwebtoken';
import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';
import {
  SIGNATURE_COOKIE_KEY,
  AUTH_SERVER_AUTHORIZERS_I,
  AUTH_MODULE_CONFIGS_I,
} from '../constant';
import type {
  ServerAuthorizer,
  AuthInfo,
  AuthTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthAPIResponseBody,
  VerifiableRequest,
  AuthModuleConfigs,
} from '../types';

import { getCookies, isSubpath } from './utils';
import { CookieAccessor, CookieOperator } from './cookie';

type SuccessAuthorizationResult = {
  success: true,
  auth: AuthInfo<any>,
};

type FailedAuthorizationResult = {
  success: false,
  code: number,
  reason: string,
};

type AuthorizationResult =
  | SuccessAuthorizationResult
  | FailedAuthorizationResult;

const getSignature = (req: VerifiableRequest) => {
  const cookies = getCookies(req);
  return cookies ? cookies[SIGNATURE_COOKIE_KEY] : undefined;
};

const parseBody = async (req: IncomingMessage): null | Object => {
  try {
    const rawBody = await getRawBody(req);
    const body = JSON.parse(rawBody);

    return typeof body === 'object' ? body : null;
  } catch (err) {
    return null;
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
  authorizers: ServerAuthorizer<any, any>[];
  secret: string;
  entryPath: string;

  _sessionOperator: CookieOperator;

  constructor(
    authorizers: ServerAuthorizer<any, any>[],
    {
      secret,
      entryPath = '/',
      authCookieAge = 180, // 3 min
      dataCookieAge = 60, // 1 min
      tokenAge = 1800, // 30 min
      refreshPeriod = 86400, // 1 day
      cookieDomain,
      cookiePath = '/',
      sameSite = 'None',
      secure = true,
    }: AuthModuleConfigs = {}
  ) {
    invariant(secret, 'options.secret must not be empty');
    invariant(
      authorizers && authorizers.length > 0,
      'options.authorizers must not be empty'
    );

    invariant(
      isSubpath(cookiePath, entryPath),
      'options.entryPath should be a subpath of options.cookiePath'
    );

    this.secret = secret;
    this.authorizers = authorizers;
    this.entryPath = entryPath;

    this._sessionOperator = new CookieOperator({
      entryPath,
      secret,
      authCookieAge,
      dataCookieAge,
      tokenAge,
      refreshPeriod,
      cookieDomain,
      cookiePath,
      sameSite,
      secure,
    });
  }

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const { pathname } = parseURL(req.url, true);

    const subpath = getRelativePath(this.entryPath, pathname || '/');
    if (subpath === '' || subpath.slice(0, 2) === '..') {
      respondAPIError(res, 403, 'path forbidden');
      return;
    }

    // inner auth api for client controller
    if (subpath[0] === '_') {
      if (req.method !== 'POST') {
        respondAPIError(res, 405, 'method not allowed');
        return;
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
      return;
    }

    const [platform] = subpath.split('/');

    const authorizer = this._getAuthorizerOf(platform);
    if (!authorizer) {
      respondAPIError(res, 404, `platform "${platform}" not found`);
      return;
    }

    try {
      await authorizer.delegateAuthRequest(
        req,
        res,
        new CookieAccessor(req, res, platform, this._sessionOperator)
      );
    } catch (err) {
      if (!res.finished) {
        respondAPIError(res, err.code || 500, err.message);
      }
      return;
    }

    if (!res.finished) {
      respondAPIError(res, 501, 'connection not closed by authorizer');
    }
  }

  async verifyHTTPAuthorization(
    req: VerifiableRequest,
    tokenProvided?: string
  ): Promise<AuthorizationResult> {
    const signature = getSignature(req);
    if (!signature) {
      return {
        success: false,
        code: 401,
        reason: 'require signature',
      };
    }

    let token = tokenProvided;
    if (!token) {
      const { authorization } = req.headers;
      if (!authorization) {
        return {
          success: false,
          code: 401,
          reason: 'no Authorization header',
        };
      }

      const [scheme, tokenFromHeader] = authorization.split(/\s+/, 2);
      if (scheme !== 'Bearer' || !tokenFromHeader) {
        return {
          success: false,
          code: 400,
          reason: 'invalid auth scheme',
        };
      }
      token = tokenFromHeader;
    }

    const verifyResult = await this._verifyToken(token, signature);
    if (!verifyResult.success) {
      return verifyResult;
    }

    const { platform, data, exp, iat } = verifyResult.payload;

    const authorizer = this._getAuthorizerOf(platform);
    if (!authorizer) {
      return {
        success: false,
        code: 404,
        reason: `unknown platform "${platform}"`,
      };
    }

    const result = await authorizer.refineAuth(data);
    if (!result) {
      return {
        success: false,
        code: 400,
        reason: 'invalid auth data',
      };
    }

    const { authorizedChannel, user } = result;
    return {
      success: true,
      auth: {
        platform,
        authorizedChannel,
        user,
        data,
        loginAt: new Date(iat * 1000),
        expireAt: new Date(exp * 1000),
      },
    };
  }

  async _handleSignRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      if (!body) {
        respondAPIError(res, 400, 'invalid body format');
        return;
      }

      const { platform, credential } = (body: SignRequestBody<any>);
      if (!platform || !credential) {
        respondAPIError(res, 400, 'invalid sign params');
        return;
      }

      const authorizer = this._getAuthorizerOf(platform);
      if (!authorizer) {
        respondAPIError(res, 404, `unknown platform "${platform}"`);
        return;
      }

      const verifyResult = await authorizer.verifyCredential(credential);
      if (!verifyResult.success) {
        const { code, reason } = verifyResult;
        respondAPIError(res, code, reason);
        return;
      }

      const { data, refreshable } = verifyResult;
      const token = await this._sessionOperator.issueAuth(res, platform, data, {
        refreshable,
        signatureOnly: true,
      });

      respondAPIOk(res, platform, token);
    } catch (err) {
      respondAPIError(res, 500, err.message);
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
      const body = await parseBody(req);
      if (!body) {
        respondAPIError(res, 400, 'invalid body format');
        return;
      }

      const { token } = (body: RefreshRequestBody);
      if (!token) {
        respondAPIError(res, 400, 'empty token received');
        return;
      }

      const tokenResult = await this._verifyToken(token, signature, {
        ignoreExpiration: true,
      });
      if (!tokenResult.success) {
        const { code, reason } = tokenResult;
        respondAPIError(res, code, reason);
        return;
      }

      const { refreshLimit, platform, data } = tokenResult.payload;
      if (!refreshLimit) {
        respondAPIError(res, 400, 'token not refreshable');
        return;
      }

      if (refreshLimit * 1000 >= Date.now()) {
        // refresh signature and issue new token
        const authorizer = this._getAuthorizerOf(platform);
        if (!authorizer) {
          respondAPIError(res, 404, `unknown platform "${platform}"`);
          return;
        }

        const refreshResult = await authorizer.verifyRefreshment(data);
        if (!refreshResult.success) {
          const { code, reason } = refreshResult;
          respondAPIError(res, code, reason);
          return;
        }

        const newToken = await this._sessionOperator.issueAuth(
          res,
          platform,
          refreshResult.data,
          { refreshLimit, refreshable: true, signatureOnly: true }
        );
        respondAPIOk(res, platform, newToken);
      } else {
        respondAPIError(res, 401, 'refreshment period expired');
      }
    } catch (err) {
      respondAPIError(res, 500, err.message);
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
      const body = await parseBody(req);
      if (!body) {
        respondAPIError(res, 400, 'invalid body format');
        return;
      }

      const { token } = (body: VerifyRequestBody);
      if (!token) {
        respondAPIError(res, 400, 'empty token received');
        return;
      }

      const verifyResult = await this._verifyToken(token, signature);
      if (!verifyResult.success) {
        const { code, reason } = verifyResult;
        respondAPIError(res, code, reason);
        return;
      }

      const { platform } = verifyResult.payload;
      const authorizer = this._getAuthorizerOf(platform);
      if (!authorizer) {
        respondAPIError(res, 404, `unknown platform "${platform}"`);
        return;
      }

      respondAPIOk(res, platform, token);
    } catch (err) {
      respondAPIError(res, 500, err.message);
    }
  }

  async _verifyToken(
    token: string,
    signature: string,
    jwtVerifyOpts?: Object
  ): Promise<
    | { success: true, payload: AuthTokenPayload<any> }
    | { success: false, code: number, reason: string }
  > {
    try {
      const payload: AuthTokenPayload<any> = await thenifiedly.call(
        verifyJWT,
        `${token}.${signature}`,
        this.secret,
        jwtVerifyOpts
      );

      return { success: true, payload };
    } catch (err) {
      const code =
        err.name === 'TokenExpiredError' || err.name === 'NotBeforeError'
          ? 401
          : 400;

      return { success: false, code, reason: err.message };
    }
  }

  _getAuthorizerOf(platform: string): null | ServerAuthorizer<any, any> {
    for (const authorizer of this.authorizers) {
      if (platform === authorizer.platform) {
        return authorizer;
      }
    }
    return null;
  }
}

export default provider<AuthServerController>({
  lifetime: 'singleton',
  deps: [AUTH_SERVER_AUTHORIZERS_I, AUTH_MODULE_CONFIGS_I],
})(AuthServerController);
