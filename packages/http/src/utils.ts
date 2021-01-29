/** @internal */ /** */
import { STATUS_CODES } from 'http';
import type { ServerResponse } from 'http';
import { relative as getRelativePath } from 'path';
import { Socket } from 'net';

export const getTrailingPath = (
  parent: string,
  child: string
): string | undefined => {
  const relativePath = getRelativePath(parent, child);
  return relativePath === '' || relativePath.slice(0, 2) !== '..'
    ? relativePath
    : undefined;
};

type Routing = { name?: string; path: string };

export const checkRoutesConfliction = (
  existedRoutings: ReadonlyArray<Routing>,
  newRoute: Routing
): [boolean, Routing] => {
  for (const route of existedRoutings) {
    if (
      getTrailingPath(route.path, newRoute.path) ||
      getTrailingPath(newRoute.path, route.path)
    ) {
      return [false, route];
    }
  }
  return [true, null as never];
};

export const endRes = (res: ServerResponse, code: number): void => {
  res.statusCode = code;
  res.end(STATUS_CODES[code]);
};

export const respondUpgrade = (socket: Socket, code: number): void => {
  const codeName = STATUS_CODES[code] as string;
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
