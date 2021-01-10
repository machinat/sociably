import type {
  IncomingMessage,
  ServerResponse,
  IncomingHttpHeaders,
} from 'http';
import type { Socket } from 'net';

export type RoutingInfo = {
  originalPath: string;
  matchedPath: string;
  trailingPath: string;
};

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  routingInfo: RoutingInfo
) => void;

export type HttpRequestRouting = {
  name?: string;
  path: string;
  handler: RequestHandler;
};

export type UpgradeHandler = (
  req: IncomingMessage,
  socket: Socket,
  head: Buffer,
  routingInfo: RoutingInfo
) => void;

export type HttpUpgradeRouting = {
  name?: string;
  path: string;
  handler: UpgradeHandler;
};

export type ServerListenOptions = {
  port?: number;
  host?: string;
  path?: string;
  backlog?: number;
  exclusive?: boolean;
  readableAll?: boolean;
  writableAll?: boolean;
  ipv6Only?: boolean;
};

export type HttpRequestInfo = {
  method: string;
  url: string;
  headers: IncomingHttpHeaders;
  body?: string;
};

export type HttpModuleConfigs = ServerListenOptions;
