// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => void;

export type UpgradeHandler = (
  req: IncomingMessage,
  socket: Socket,
  head: Buffer
) => void;

export type ServerListenOptions = {|
  port?: number,
  host?: string,
  path?: string,
  backlog?: number,
  exclusive?: boolean,
  readableAll?: boolean,
  writableAll?: boolean,
  ipv6Only?: boolean,
|};

export type HTTPModuleConfigs = {|
  basePath?: string,
  listenOptions?: ServerListenOptions,
|};
