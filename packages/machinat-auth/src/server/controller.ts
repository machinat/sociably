import { parse as parseURL } from 'url';
import { relative as getRelativePath } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { provider } from '@machinat/core/service';
import { HTTPRequestInfo } from '@machinat/http/types';
import invariant from 'invariant';
import {
  verify as verifyJWT,
  VerifyOptions as JWTVerifyOptions,
} from 'jsonwebtoken';
import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';
import {
  SIGNATURE_COOKIE_KEY,
  SERVER_AUTHORIZERS_I,
  MODULE_CONFIGS_I,
} from '../constant';
import type {
  ServerAuthorizer,
  AuthTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthAPIResponseBody,
  AuthAPIErrorBody,
  AuthModuleConfigs,
  AuthContext,
  WithHeaders,
} from '../types';

import { getCookies, isSubpath } from './utils';
import { CookieAccessor, CookieController } from './cookie';

const getSignature = (req: WithHeaders) => {
  const cookies = getCookies(req);
  return cookies ? cookies[SIGNATURE_COOKIE_KEY] : undefined;
};

const parseBody = async (req: IncomingMessage): Promise<null | any> => {
  try {
    const rawBody = await getRawBody(req, { encoding: true });
    const body = JSON.parse(rawBody);

    return typeof body === 'object' ? body : null;
  } catch (err) {
    return null;
  }
};

const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

const respondAPIOk = (res: ServerResponse, platform: string, token: string) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  const body: AuthAPIResponseBody = { platform, token };
  res.end(JSON.stringify(body));
};

const respondAPIError = (res: ServerResponse, code: number, reason: string) => {
  res.writeHead(code, CONTENT_TYPE_JSON);
  const body: AuthAPIErrorBody = { error: { code, reason } };
  res.end(JSON.stringify(body));
};

type AuthVerifyResult<AuthData> =
  | { success: true; token: string; auth: AuthContext<AuthData> }
  | { success: false; token: void | string; code: number; reason: string };

export class AuthServerController {
  authorizers: ServerAuthorizer<any, any>[];
  secret: string;
  entryPath: string;

  private _cookieController: CookieController;

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
      sameSite = 'none',
      secure = true,
    }: AuthModuleConfigs = {} as any
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

    this._cookieController = new CookieController({
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
    const { pathname } = parseURL(req.url as string, true);

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
        new CookieAccessor(req, res, platform, this._cookieController)
      );
    } catch (err) {
      if (!res.writableEnded) {
        respondAPIError(res, err.code || 500, err.message);
      }
      return;
    }

    if (!res.writableEnded) {
      respondAPIError(res, 501, 'connection not closed by authorizer');
    }
  }

  async verifyAuth(
    req: HTTPRequestInfo,
    tokenProvided?: string
  ): Promise<AuthVerifyResult<any>> {
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

    const result = await authorizer.refineAuth(data);
    if (!result) {
      return {
        success: false,
        token,
        code: 400,
        reason: 'invalid auth data',
      };
    }

    const { channel, user } = result;
    return {
      success: true,
      token,
      auth: {
        platform,
        channel,
        user,
        data,
        loginAt: new Date(iat * 1000),
        expireAt: new Date(exp * 1000),
      },
    };
  }

  private async _handleSignRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      if (!body) {
        respondAPIError(res, 400, 'invalid body format');
        return;
      }

      const { platform, credential } = body as SignRequestBody<any>;
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
      const token = await this._cookieController.issueAuth(
        res,
        platform,
        data,
        {
          refreshable,
          signatureOnly: true,
        }
      );

      respondAPIOk(res, platform, token);
    } catch (err) {
      respondAPIError(res, 500, err.message);
    }
  }

  private async _handleRefreshRequest(
    req: IncomingMessage,
    res: ServerResponse
  ) {
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

      const { token } = body as RefreshRequestBody;
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

        const newToken = await this._cookieController.issueAuth(
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

  private async _handleVerifyRequest(
    req: IncomingMessage,
    res: ServerResponse
  ) {
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

      const { token } = body as VerifyRequestBody;
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

  private async _verifyToken(
    token: string,
    signature: string,
    jwtVerifyOptions?: JWTVerifyOptions
  ): Promise<
    | { success: true; payload: AuthTokenPayload<any> }
    | { success: false; code: number; reason: string }
  > {
    try {
      const payload: AuthTokenPayload<any> = await thenifiedly.call(
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

  private _getAuthorizerOf(
    platform: string
  ): null | ServerAuthorizer<any, any> {
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
  deps: [SERVER_AUTHORIZERS_I, MODULE_CONFIGS_I],
})(AuthServerController);
