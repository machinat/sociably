import type { ServerResponse, IncomingMessage } from 'http';
import { posix as posixPath } from 'path';
import getRawBody from 'raw-body';
import {
  parse as parseCookie,
  serialize as serializeCookie,
  CookieSerializeOptions,
} from 'cookie';
import type {
  WithHeaders,
  AuthApiResponseBody,
  AuthApiErrorBody,
} from './types.js';

export const respondRedirect = (res: ServerResponse, url: string): void => {
  res.writeHead(302, { Location: url });
  res.end();
};

export const getCookies = (req: WithHeaders): null | Record<string, string> => {
  if (!req.headers.cookie) {
    return null;
  }
  return parseCookie(req.headers.cookie);
};

const SET_COOKIE = 'Set-Cookie';

export const setCookie = (
  res: ServerResponse,
  key: string,
  value: string,
  options: CookieSerializeOptions
): void => {
  const cookieDesc = serializeCookie(key, value, options);
  const cookiesAlreadySet = res.getHeader(SET_COOKIE);

  res.setHeader(
    SET_COOKIE,
    Array.isArray(cookiesAlreadySet)
      ? [...cookiesAlreadySet, cookieDesc]
      : typeof cookiesAlreadySet === 'string'
      ? [cookiesAlreadySet, cookieDesc]
      : cookieDesc
  );
};

export const isSubdomain = (domain: string, subdomain: string): boolean =>
  subdomain.endsWith(domain) &&
  (subdomain.length === domain.length ||
    subdomain[subdomain.length - domain.length - 1] === '.');

export const isSubpath = (
  path: null | string,
  subpath: null | string
): boolean =>
  !!(path && subpath) && !posixPath.relative(path, subpath).startsWith('..');

const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

export const respondApiOk = (
  res: ServerResponse,
  platform: string,
  token: string
): void => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  const body: AuthApiResponseBody = { platform, token };
  res.end(JSON.stringify(body));
};

export const respondApiError = (
  res: ServerResponse,
  platform: undefined | string,
  code: number,
  reason: string
): void => {
  res.writeHead(code, CONTENT_TYPE_JSON);
  const body: AuthApiErrorBody = { platform, error: { code, reason } };
  res.end(JSON.stringify(body));
};

export const parseJsonBody = async (req: IncomingMessage): Promise<any> => {
  try {
    const rawBody = await getRawBody(req, { encoding: true });
    const body = JSON.parse(rawBody);

    return typeof body === 'object' ? body : null;
  } catch (err) {
    return null;
  }
};
