import { MaybeContainer } from '@machinat/core/service';
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import type createNextServer from 'next';

export type NextServer = ReturnType<typeof createNextServer>;

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
  method: string;
  url: string;
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
  headers?: OutgoingHttpHeaders;
  code: number;
  reason: string;
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
