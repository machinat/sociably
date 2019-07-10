// @flow
import type { IncomingMessage } from 'http';
import { parse } from 'url';
import { join } from 'path';

export const path = (...paths: string[]) => {
  const expectedPath = join(...paths);

  return (req: IncomingMessage): boolean => {
    const { pathname } = parse(req.url);
    if (typeof pathname !== 'string') {
      return false;
    }

    return pathname === expectedPath;
  };
};

export const pathMatch = (pattern: RegExp) => (
  req: IncomingMessage
): boolean => {
  const { pathname } = parse(req.url);
  if (typeof pathname !== 'string') {
    return false;
  }

  return pattern.test(pathname);
};
