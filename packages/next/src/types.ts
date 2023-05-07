import type {
  IncomingMessage,
  ServerResponse,
  IncomingHttpHeaders,
  OutgoingHttpHeaders,
} from 'http';
import type { ParsedUrlQuery } from 'querystring';
import type { UrlWithParsedQuery } from 'url';
import { MaybeContainer } from '@sociably/core/service';

export interface NextServer {
  options: NextServerOptions;
  readonly hostname?: string;
  readonly port?: number;
  getRequestHandler(): (
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl?: UrlWithParsedQuery
  ) => Promise<void>;
  getUpgradeHandler(): (
    req: IncomingMessage,
    socket: any,
    head: any
  ) => Promise<void>;
  setAssetPrefix(assetPrefix: string): void;
  logError(error: Error): void;
  render(
    eq: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query?: ParsedUrlQuery,
    parsedUrl?: UrlWithParsedQuery,
    internal?: boolean
  ): Promise<void>;
  renderToHTML(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query?: ParsedUrlQuery
  ): Promise<string | null>;
  renderError(
    err: Error | null,
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query?: ParsedUrlQuery,
    setHeaders?: boolean
  ): Promise<void>;
  renderErrorToHTML(
    err: Error | null,
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query?: ParsedUrlQuery
  ): Promise<string | null>;
  render404(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl?: UrlWithParsedQuery,
    setHeaders?: boolean
  ): Promise<void>;
  serveStatic(
    req: IncomingMessage,
    res: ServerResponse,
    path: string,
    parsedUrl?: UrlWithParsedQuery
  ): Promise<void>;
  prepare(): Promise<void>;
  close(): Promise<any>;
}

export type NextServerOptions = {
  /**
   * Where the Next project is located - @default '.'
   */
  dir?: string;
  /**
   * Hide error messages containing server information - @default false
   */
  quiet?: boolean;
  /**
   * Object what you would use in next.config.js - @default {}
   */
  conf?: null | { [key: string]: any };
  dev?: boolean;
};

export type RequestInfo = {
  /** method of the HTTP request */
  method: string;
  /** URL of the HTTP request */
  url: string;
  /** route path under next entry, the `entryPath` would be trimmed */
  route: string;
  /** headers of the HTTP request */
  headers: IncomingHttpHeaders;
};

type OkHandlerResponse = {
  ok: true;
  headers?: OutgoingHttpHeaders;
  page?: string;
  query?: {
    [key: string]: any;
  };
};

type ErrorHandlerResponse = {
  ok: false;
  code: number;
  reason?: string;
  headers?: OutgoingHttpHeaders;
};

export type HandlerResponse = OkHandlerResponse | ErrorHandlerResponse;

export type HandleNextRequestFn = (
  request: RequestInfo
) => HandlerResponse | Promise<HandlerResponse>;

export type NextRequestHandler = MaybeContainer<HandleNextRequestFn>;

export type NextConfigs = {
  entryPath?: string;
  noPrepare?: boolean;
  serverOptions?: NextServerOptions;
  handleRequest?: NextRequestHandler;
};
