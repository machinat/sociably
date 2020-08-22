import type { ServerResponse } from 'http';
import {
  parse as parseCookie,
  serialize as serializeCookie,
  CookieSerializeOptions,
} from 'cookie';
import type { WithHeaders } from '../types';

export const respondRedirect = (res: ServerResponse, url: string): void => {
  res.writeHead(302, { Location: url });
  res.end();
};

export const getCookies = (
  req: WithHeaders
): null | {
  [key: string]: string;
} => {
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
  subdomain.slice(-domain.length) === domain &&
  (subdomain.length === domain.length ||
    subdomain[subdomain.length - domain.length - 1] === '.');

export const isSubpath = (path: string, subpath: string): boolean =>
  subpath.slice(0, path.length) === path &&
  (subpath.length === path.length ||
    path[path.length - 1] === '/' ||
    subpath[path.length] === '/');
