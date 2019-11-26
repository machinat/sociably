// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';

export const respondRedirect = (res: ServerResponse, url: string) => {
  res.writeHead(302, { Location: url });
  res.end();
};

export const getCookies = (
  req: IncomingMessage
): null | {| [string]: string |} => {
  if (!req.headers.cookie) {
    return null;
  }
  return parseCookie(req.headers.cookie);
};

export const setCookie = (
  res: ServerResponse,
  key: string,
  value: string,
  options: Object
) => {
  res.setHeader('Set-Cookie', serializeCookie(key, value, options));
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
