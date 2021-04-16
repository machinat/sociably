import { MaybeContainer } from '@machinat/core/service';
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import type createNextServer from 'next';

export type NextServer = ReturnType<typeof createNextServer>;

export type NextServerOptions = Parameters<typeof createNextServer>[0];

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
