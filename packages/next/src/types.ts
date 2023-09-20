import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import type NextJs from 'next';
import { MaybeContainer } from '@sociably/core/service';

export type NextServer = ReturnType<typeof NextJs.default>;
export type NextServerOptions = Parameters<typeof NextJs.default>[0];

export type RequestInfo = {
  /** Method of the HTTP request */
  method: string;
  /** URL of the HTTP request */
  url: string;
  /** Route path under next entry, the `entryPath` would be trimmed */
  route: string;
  /** Headers of the HTTP request */
  headers: IncomingHttpHeaders;
};

type OkHandlerResponse = {
  ok: true;
  headers?: OutgoingHttpHeaders;
  page?: string;
  query?: Record<string, any>;
};

type ErrorHandlerResponse = {
  ok: false;
  code: number;
  reason?: string;
  headers?: OutgoingHttpHeaders;
};

export type HandlerResponse = OkHandlerResponse | ErrorHandlerResponse;

export type HandleNextRequestFn = (
  request: RequestInfo,
) => HandlerResponse | Promise<HandlerResponse>;

export type NextRequestHandler = MaybeContainer<HandleNextRequestFn>;

export type NextConfigs = {
  entryPath?: string;
  noPrepare?: boolean;
  serverOptions?: NextServerOptions;
  handleRequest?: NextRequestHandler;
};
