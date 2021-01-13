import { parse as parseUrl } from 'url';
import { relative as getRelativePath, join as joinPath } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';
import { HttpRequestInfo, RoutingInfo } from '@machinat/http/types';
import invariant from 'invariant';
import {
  verify as verifyJWT,
  VerifyOptions as JWTVerifyOptions,
} from 'jsonwebtoken';
import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';
import { SIGNATURE_COOKIE_KEY } from './constant';
import { AUTHORIZERS_I, MODULE_CONFIGS_I } from './interface';
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

import { getCookies, isSubpath } from './utils';
import { CookieAccessor, CookieController } from './cookie';

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
const respondApiError = (res: ServerResponse, code: number, reason: string) => {
  res.writeHead(code, CONTENT_TYPE_JSON);
  const body: AuthApiErrorBody = { error: { code, reason } };
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

    const {
      secret,
      entryPath = '/',
      dataCookieAge = 180, // 3 min
      tokenAge = 1800, // 30 min
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

    this.secret = secret;
    this.authorizers = authorizers;
    this.entryPath = entryPath;

    this._cookieController = new CookieController({
      entryPath,
      secret,
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
      respondApiError(res, 403, 'path forbidden');
      return;
    }

    // inner auth api for client controller
    if (subpath[0] === '_') {
      if (req.method !== 'POST') {
        respondApiError(res, 405, 'method not allowed');
        return;
      }

      if (subpath === '_sign') {
        await this._handleSignRequest(req, res);
      } else if (subpath === '_refresh') {
        await this._handleRefreshRequest(req, res);
      } else if (subpath === '_verify') {
        await this._handleVerifyRequest(req, res);
      } else {
        respondApiError(res, 404, `invalid auth api route "${subpath}"`);
      }
      return;
    }

    const [platform] = subpath.split('/');

    const authorizer = this._getAuthorizerOf(platform);
    if (!authorizer) {
      respondApiError(res, 404, `platform "${platform}" not found`);
      return;
    }

    try {
      await authorizer.delegateAuthRequest(
        req,
        res,
        new CookieAccessor(req, res, platform, this._cookieController),
        {
          originalPath: pathname || '/',
          matchedPath: joinPath(
            routingInfo ? routingInfo.matchedPath : this.entryPath,
            platform
          ),
          trailingPath: getRelativePath(platform, subpath),
        }
      );
    } catch (err) {
      if (!res.writableEnded) {
        respondApiError(res, err.code || 500, err.message);
      }
      return;
    }

    if (!res.writableEnded) {
      respondApiError(res, 501, 'connection not closed by authorizer');
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

    const verifyResult = await this._verifyToken(token, signature);
    if (!verifyResult.success) {
      const { code, reason } = verifyResult;
      return {
        success: false,
        token,
        code,
        reason,
      };
    }

    const { platform, data, exp, iat } = verifyResult.payload;

    const authorizer = this._getAuthorizerOf(platform);
    if (!authorizer) {
      return {
        success: false,
        token,
        code: 404,
        reason: `unknown platform "${platform}"`,
      };
    }

    const supplement = await authorizer.supplementContext(data);
    if (!supplement) {
      return {
        success: false,
        token,
        code: 400,
        reason: 'invalid auth data',
      };
    }

    const authData = {
      ...supplement,
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
        respondApiError(res, 400, 'invalid body format');
        return;
      }

      const { platform, credential } = body as SignRequestBody<unknown>;
      if (!platform || !credential) {
        respondApiError(res, 400, 'invalid sign params');
        return;
      }

      const authorizer = this._getAuthorizerOf(platform);
      if (!authorizer) {
        respondApiError(res, 404, `unknown platform "${platform}"`);
        return;
      }

      const verifyResult = await authorizer.verifyCredential(credential);
      if (!verifyResult.success) {
        const { code, reason } = verifyResult;
        respondApiError(res, code, reason);
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
      respondApiError(res, 500, err.message);
    }
  }

  private async _handleRefreshRequest(
    req: IncomingMessage,
    res: ServerResponse
  ) {
    // get signature from cookie
    const signature = getSignature(req);
    if (!signature) {
      respondApiError(res, 401, 'no signature found');
      return;
    }

    try {
      // verify token in body ignoring expiration
      const body = await parseBody(req);
      if (!body) {
        respondApiError(res, 400, 'invalid body format');
        return;
      }

      const { token } = body as RefreshRequestBody;
      if (!token) {
        respondApiError(res, 400, 'empty token received');
        return;
      }

      const tokenResult = await this._verifyToken(token, signature, {
        ignoreExpiration: true,
      });
      if (!tokenResult.success) {
        const { code, reason } = tokenResult;
        respondApiError(res, code, reason);
        return;
      }

      const { refreshTill, platform, data } = tokenResult.payload;
      if (!refreshTill) {
        respondApiError(res, 400, 'token not refreshable');
        return;
      }

      if (refreshTill * 1000 >= Date.now()) {
        // refresh signature and issue new token
        const authorizer = this._getAuthorizerOf(platform);
        if (!authorizer) {
          respondApiError(res, 404, `unknown platform "${platform}"`);
          return;
        }

        const refreshResult = await authorizer.verifyRefreshment(data);
        if (!refreshResult.success) {
          const { code, reason } = refreshResult;
          respondApiError(res, code, reason);
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
        respondApiError(res, 401, 'refreshment period expired');
      }
    } catch (err) {
      respondApiError(res, 500, err.message);
    }
  }

  private async _handleVerifyRequest(
    req: IncomingMessage,
    res: ServerResponse
  ) {
    // get signature from cookie
    const signature = getSignature(req);
    if (!signature) {
      respondApiError(res, 401, 'no signature found');
      return;
    }

    try {
      // verify token in body
      const body = await parseBody(req);
      if (!body) {
        respondApiError(res, 400, 'invalid body format');
        return;
      }

      const { token } = body as VerifyRequestBody;
      if (!token) {
        respondApiError(res, 400, 'empty token received');
        return;
      }

      const verifyResult = await this._verifyToken(token, signature);
      if (!verifyResult.success) {
        const { code, reason } = verifyResult;
        respondApiError(res, code, reason);
        return;
      }

      const { platform } = verifyResult.payload;
      const authorizer = this._getAuthorizerOf(platform);
      if (!authorizer) {
        respondApiError(res, 404, `unknown platform "${platform}"`);
        return;
      }

      respondApiOk(res, platform, token);
    } catch (err) {
      respondApiError(res, 500, err.message);
    }
  }

  private async _verifyToken(
    token: string,
    signature: string,
    jwtVerifyOptions?: JWTVerifyOptions
  ): Promise<
    | { success: true; payload: AuthTokenPayload<unknown> }
    | { success: false; code: number; reason: string }
  > {
    try {
      const payload: AuthTokenPayload<unknown> = await thenifiedly.call(
        verifyJWT,
        `${token}.${signature}`,
        this.secret,
        jwtVerifyOptions
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
