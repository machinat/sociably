// @flow
import type { ServerResponse } from 'http';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import type { VerifiableRequest } from '../types';

export const respondRedirect = (res: ServerResponse, url: string) => {
  res.writeHead(302, { Location: url });
  res.end();
};

export const getCookies = (
  req: VerifiableRequest
): null | {| [string]: string |} => {
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
  options: Object
) => {
  const cookieDesc = serializeCookie(key, value, options);
  const cookiesAlreadySet = res.getHeader(SET_COOKIE);

  const cookieToSet =
    typeof cookiesAlreadySet === 'string'
      ? [cookiesAlreadySet, cookieDesc]
      : cookiesAlreadySet
      ? [...cookiesAlreadySet, cookieDesc]
      : cookieDesc;

  res.setHeader(SET_COOKIE, cookieToSet);
};

export const checkDomainScope = (subdomain: string, domain: string) =>
  subdomain.slice(-domain.length) === domain &&
  (subdomain.length === domain.length ||
    subdomain[subdomain.length - domain.length - 1] === '.');

export const checkPathScope = (subpath: string, path: string) =>
  subpath.slice(0, path.length) === path &&
  (subpath.length === path.length ||
    path[path.length - 1] === '/' ||
    subpath[subpath.length - path.length] === '/');
