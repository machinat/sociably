import { parse as parseUrl } from 'url';
import { relative as getRelativePath, join as joinPath } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';
import { HttpRequestInfo, RoutingInfo } from '@machinat/http/types';
import invariant from 'invariant';
import {
  verify as verifyJwt,
  decode as decodeJwt,
  VerifyOptions as JWTVerifyOptions,
} from 'jsonwebtoken';
import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';
import { SIGNATURE_COOKIE_KEY } from './constant';
import { AUTHORIZERS_I, MODULE_CONFIGS_I } from './interface';
import AuthError from './error';
import type {
  AnyServerAuthorizer,
  AuthTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthApiResponseBody,
  AuthApiErrorBody,
  AuthModuleConfigs,
  ContextOfAuthorizer,
  WithHeaders,
} from './types';

import { getCookies, isSubpath, isSubdomain } from './utils';
import CookieController from './cookie';

/** @internal */

const getSignature = (req: WithHeaders) => {
  const cookies = getCookies(req);
  return cookies ? cookies[SIGNATURE_COOKIE_KEY] : undefined;
};

/** @internal */
const parseBody = async (req: IncomingMessage): Promise<any> => {
  try {
    const rawBody = await getRawBody(req, { encoding: true });
    const body = JSON.parse(rawBody);

    return typeof body === 'object' ? body : null;
  } catch (err) {
    return null;
  }
};

/** @ignore */
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

/** @internal */
const respondApiOk = (res: ServerResponse, platform: string, token: string) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  const body: AuthApiResponseBody = { platform, token };
  res.end(JSON.stringify(body));
};

/** @internal */
const respondApiError = (
  res: ServerResponse,
  platform: undefined | string,
  code: number,
  reason: string
) => {
  res.writeHead(code, CONTENT_TYPE_JSON);
  const body: AuthApiErrorBody = { platform, error: { code, reason } };
  res.end(JSON.stringify(body));
};

type AuthVerifyResult<Authorizer extends AnyServerAuthorizer> =
  | { success: true; token: string; context: ContextOfAuthorizer<Authorizer> }
  | { success: false; token: void | string; code: number; reason: string };

/**
 * @category Provider
 */
export class AuthController<Authorizer extends AnyServerAuthorizer> {
  authorizers: Authorizer[];
  secret: string;
  entryPath: string;

  private _cookieController: CookieController;

  constructor(authorizers: Authorizer[], options: AuthModuleConfigs) {
    invariant(
      authorizers && authorizers.length > 0,
      'authorizers must not be empty'
    );
    invariant(options && options.secret, 'options.secret must not be empty');
    invariant(options.redirectUrl, 'options.redirectUrl must not be empty');

    const {
      secret,
      entryPath = '/',
      redirectUrl,
      authCookieAge = 600, // 10 min
      dataCookieAge = 180, // 3 min
      tokenAge = 3600, // 1 hr
      refreshPeriod = 86400, // 1 day
      cookieDomain,
      cookiePath = '/',
      sameSite = 'lax',
      secure = true,
    } = options;

    invariant(
      isSubpath(cookiePath, entryPath),
      'options.entryPath should be a subpath of options.cookiePath'
    );

    const { pathname: redirectPathname, hostname: redirectDomain } = parseUrl(
      redirectUrl
    );
    invariant(
      redirectPathname &&
        isSubpath(cookiePath, redirectPathname) &&
        (!cookieDomain ||
          !redirectDomain ||
          isSubdomain(cookieDomain, redirectDomain)),
      `options.redirectUrl should be under cookie scope "${
        cookieDomain ? `//${cookieDomain}` : ''
      }${cookiePath}"`
    );

    this.secret = secret;
    this.authorizers = authorizers;
    this.entryPath = entryPath;

    this._cookieController = new CookieController({
      entryPath,
      redirectUrl,
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
    res: ServerResponse,
    routingInfo?: RoutingInfo
  ): Promise<void> {
    const { pathname } = parseUrl(req.url as string);
    const subpath =
      routingInfo?.trailingPath ||
      getRelativePath(this.entryPath, pathname || '/');

    if (subpath === '' || subpath.slice(0, 2) === '..') {
      respondApiError(res, undefined, 403, 'path forbidden');
      return;
    }

    // inner auth api for client controller
    if (subpath[0] === '_') {
      if (req.method !== 'POST') {
        respondApiError(res, undefined, 405, 'method not allowed');
        return;
      }

      if (subpath === '_sign') {
        await this._handleSignRequest(req, res);
      } else if (subpath === '_refresh') {
        await this._handleRefreshRequest(req, res);
      } else if (subpath === '_verify') {
        await this._handleVerifyRequest(req, res);
      } else {
        respondApiError(
          res,
          undefined,
          404,
          `invalid auth api route "${subpath}"`
        );
      }
      return;
    }

    const [platform] = subpath.split('/');

    const authorizer = this._getAuthorizerOf(platform);
    if (!authorizer) {
      respondApiError(res, undefined, 404, `platform "${platform}" not found`);
      return;
    }

    try {
      await authorizer.delegateAuthRequest(
        req,
        res,
        this._cookieController.createResponseHelper(req, res, platform),
        {
          originalPath: pathname || '/',
          matchedPath: joinPath(
            routingInfo?.matchedPath || this.entryPath,
            platform
          ),
          trailingPath: getRelativePath(platform, subpath),
        }
      );
    } catch (err) {
      if (!res.writableEnded) {
        respondApiError(res, platform, err.code || 500, err.message);
      }
      return;
    }

    if (!res.writableEnded) {
      respondApiError(
        res,
        platform,
        501,
        'connection not closed by authorizer'
      );
    }
  }

  async verifyAuth(
    req: HttpRequestInfo,
    tokenProvided?: string
  ): Promise<AuthVerifyResult<Authorizer>> {
    let token = tokenProvided;
    if (!token) {
      const { authorization } = req.headers;
      if (!authorization) {
        return {
          success: false,
          token: undefined,
          code: 401,
          reason: 'no Authorization header',
        };
      }

      const [scheme, tokenFromHeader] = authorization.split(/\s+/, 2);
      if (scheme !== 'Bearer' || !tokenFromHeader) {
        return {
          success: false,
          token: undefined,
          code: 400,
          reason: 'invalid auth scheme',
        };
      }
      token = tokenFromHeader;
    }

    const signature = getSignature(req);
    if (!signature) {
      return {
        success: false,
        token,
        code: 401,
        reason: 'require signature',
      };
    }

    const [err, payload] = await this._verifyToken(token, signature);
    if (err) {
      const { code, message } = err;
      return {
        success: false,
        token,
        code,
        reason: message,
      };
    }

    const { platform, data, exp, iat } = payload;

    const authorizer = this._getAuthorizerOf(platform);
    if (!authorizer) {
      return {
        success: false,
        token,
        code: 404,
        reason: `unknown platform "${platform}"`,
      };
    }

    const ctxResult = authorizer.checkAuthContext(data);
    if (!ctxResult.success) {
      return {
        success: false,
        token,
        code: 400,
        reason: 'invalid auth data',
      };
    }

    const authData = {
      ...ctxResult.contextSupplment,
      platform,
      loginAt: new Date(iat * 1000),
      expireAt: new Date(exp * 1000),
    };

    return {
      success: true,
      token,
      context: authData as ContextOfAuthorizer<Authorizer>,
    };
  }

  private async _handleSignRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      if (!body) {
        respondApiError(res, undefined, 400, 'invalid body format');
        return;
      }

      const { platform, credential } = body as SignRequestBody<unknown>;
      if (!platform || !credential) {
        respondApiError(res, platform, 400, 'invalid sign params');
        return;
      }

      const authorizer = this._getAuthorizerOf(platform);
      if (!authorizer) {
        respondApiError(res, platform, 404, `unknown platform "${platform}"`);
        return;
      }

      const verifyResult = await authorizer.verifyCredential(credential);
      if (!verifyResult.success) {
        const { code, reason } = verifyResult;
        respondApiError(res, platform, code, reason);
        return;
      }

      const token = await this._cookieController.issueAuth(
        res,
        platform,
        verifyResult.data,
        { signatureOnly: true }
      );

      respondApiOk(res, platform, token);
    } catch (err) {
      respondApiError(res, undefined, 500, err.message);
    }
  }

  private async _handleRefreshRequest(
    req: IncomingMessage,
    res: ServerResponse
  ) {
    // get signature from cookie
    const signature = getSignature(req);
    if (!signature) {
      respondApiError(res, undefined, 401, 'no signature found');
      return;
    }

    try {
      // verify token in body ignoring expiration
      const body = await parseBody(req);
      if (!body) {
        respondApiError(res, undefined, 400, 'invalid body format');
        return;
      }

      const { token } = body as RefreshRequestBody;
      if (!token) {
        respondApiError(res, undefined, 400, 'empty token received');
        return;
      }

      const [err, payload] = await this._verifyToken(token, signature, {
        ignoreExpiration: true,
      });
      if (err) {
        const { platform, code, message } = err;
        respondApiError(res, platform, code, message);
        return;
      }

      const { refreshTill, platform, data } = payload;
      if (!refreshTill) {
        respondApiError(res, platform, 400, 'token not refreshable');
        return;
      }

      if (refreshTill * 1000 >= Date.now()) {
        // refresh signature and issue new token
        const authorizer = this._getAuthorizerOf(platform);
        if (!authorizer) {
          respondApiError(res, platform, 404, `unknown platform "${platform}"`);
          return;
        }

        const refreshResult = await authorizer.verifyRefreshment(data);
        if (!refreshResult.success) {
          const { code, reason } = refreshResult;
          respondApiError(res, platform, code, reason);
          return;
        }

        const newToken = await this._cookieController.issueAuth(
          res,
          platform,
          refreshResult.data,
          { refreshTill, signatureOnly: true }
        );
        respondApiOk(res, platform, newToken);
      } else {
        respondApiError(res, platform, 401, 'refreshment period expired');
      }
    } catch (err) {
      respondApiError(res, undefined, 500, err.message);
    }
  }

  private async _handleVerifyRequest(
    req: IncomingMessage,
    res: ServerResponse
  ) {
    // get signature from cookie
    const signature = getSignature(req);
    if (!signature) {
      respondApiError(res, undefined, 401, 'no signature found');
      return;
    }

    try {
      // verify token in body
      const body = await parseBody(req);
      if (!body) {
        respondApiError(res, undefined, 400, 'invalid body format');
        return;
      }

      const { token } = body as VerifyRequestBody;
      if (!token) {
        respondApiError(res, undefined, 400, 'empty token received');
        return;
      }

      const [err, payload] = await this._verifyToken(token, signature);
      if (err) {
        const { platform, code, message } = err;
        respondApiError(res, platform, code, message);
        return;
      }

      const { platform } = payload;
      const authorizer = this._getAuthorizerOf(platform);
      if (!authorizer) {
        respondApiError(res, platform, 404, `unknown platform "${platform}"`);
        return;
      }

      respondApiOk(res, platform, token);
    } catch (err) {
      respondApiError(res, undefined, 500, err.message);
    }
  }

  private async _verifyToken(
    token: string,
    signature: string,
    jwtVerifyOptions?: JWTVerifyOptions
  ): Promise<[null | AuthError, AuthTokenPayload<unknown>]> {
    try {
      const payload: AuthTokenPayload<unknown> = await thenifiedly.call(
        verifyJwt,
        `${token}.${signature}`,
        this.secret,
        jwtVerifyOptions
      );

      return [null, payload];
    } catch (err) {
      const code =
        err.name === 'TokenExpiredError' || err.name === 'NotBeforeError'
          ? 401
          : 400;

      const payload = decodeJwt(`${token}.`);
      return [
        new AuthError(
          typeof payload === 'string' ? undefined : payload?.platform,
          code,
          err.message
        ),
        null as never,
      ];
    }
  }

  private _getAuthorizerOf(platform: string): null | Authorizer {
    for (const authorizer of this.authorizers) {
      if (platform === authorizer.platform) {
        return authorizer;
      }
    }
    return null;
  }
}

export const ControllerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [AUTHORIZERS_I, MODULE_CONFIGS_I] as const,
})(AuthController);

export type ControllerP<
  Authorizer extends AnyServerAuthorizer
> = AuthController<Authorizer>;
