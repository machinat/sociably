import { STATUS_CODES } from 'http';
import type { ServerResponse } from 'http';
import { posix as posixPath } from 'path';
import type { Socket } from 'net';

export const getTrailingPath = (
  parent: string,
  child: string
): string | undefined => {
  const relativePath = posixPath.relative(parent, child);
  return relativePath === '' || !relativePath.startsWith('..')
    ? relativePath
    : undefined;
};

type Routing = {
  name?: string;
  path: string;
};

export const endRes = (res: ServerResponse, code: number): void => {
  res.statusCode = code;
  res.end(STATUS_CODES[code]);
};

export const respondUpgrade = (socket: Socket, code: number): void => {
  const codeName = STATUS_CODES[code]!;
  socket.write(
    `HTTP/1.1 ${code} ${codeName}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/html\r\n' +
      `Content-Length: ${Buffer.byteLength(codeName)}\r\n` +
      `\r\n${codeName}`
  );
  socket.destroy();
};

export const formatRoute = ({ name, path }: Routing): string =>
  `${name ? `[${name}] ` : ''}"${path}"`;

export const checkRoutePath = (
  existedRoutings: readonly Routing[],
  newRoute: Routing
): null | Error => {
  if (newRoute.path.startsWith('/')) {
    return new Error('route path should be a relative path');
  }
  if (newRoute.path.startsWith('..')) {
    return new Error('route path should be under entryUrl');
  }

  for (const route of existedRoutings) {
    if (
      getTrailingPath(route.path, newRoute.path) ||
      getTrailingPath(newRoute.path, route.path)
    ) {
      return new Error(
        `route ${formatRoute(newRoute)} is conflicted with route ${formatRoute(
          route
        )}`
      );
    }
  }
  return null;
};
