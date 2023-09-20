import type {
  IncomingMessage,
  ServerResponse,
  IncomingHttpHeaders,
} from 'http';
import type { Socket, ListenOptions } from 'net';

export type RoutingInfo = {
  originalPath: string;
  basePath: string;
  matchedPath?: string;
  trailingPath: string;
};

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  routingInfo: RoutingInfo,
) => void;

export type RequestRoute = {
  path: string;
  handler: RequestHandler;
  name?: string;
  default?: false;
};

export type DefaultRequestRoute = {
  default: true;
  handler: RequestHandler;
  name?: string;
};

export type UpgradeHandler = (
  req: IncomingMessage,
  socket: Socket,
  head: Buffer,
  routingInfo: RoutingInfo,
) => void;

export type UpgradeRoute = {
  path: string;
  handler: UpgradeHandler;
  name?: string;
  default?: false;
};

export type DefaultUpgradeRoute = {
  default: true;
  handler: UpgradeHandler;
  name?: string;
};

export type ServerListenOptions = ListenOptions;

export type HttpRequestInfo = {
  method: string;
  url: string;
  headers: IncomingHttpHeaders;
  body?: string;
};

export type HttpConfigs = {
  /** The options passed to `http.Server.listen()` method */
  listenOptions?: ServerListenOptions;
  /** Set to `true` to prevent listening HTTP request when app start */
  noServer?: boolean;
  /**
   * The external entry point URL of the server. If the URL contain a pathname,
   * it must be a directory ends with `/`
   */
  entryUrl: string;
};
