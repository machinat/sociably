// @flow
import type { IncomingMessage } from 'http';
import { parse } from 'url';
import { join } from 'path';

export const path = (...paths: string[]) => {
  const expectedPath = join(...paths);

  return (req: IncomingMessage) => {
    const { pathname } = parse(req.url);
    if (typeof pathname !== 'string') {
      return false;
    }

    return pathname === expectedPath;
  };
};

export const pathSuffixBy = (suffix: string) => (req: IncomingMessage) => {
  const { pathname } = parse(req.url);
  if (typeof pathname !== 'string') {
    return false;
  }

  return pathname.slice(-suffix.length) === suffix;
};

export const pathMatch = (pattern: RegExp) => (req: IncomingMessage) => {
  const { pathname } = parse(req.url);
  if (typeof pathname !== 'string') {
    return false;
  }

  return pattern.test(pathname);
};
