import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import type {
  EventContext,
  EventMiddleware,
  PlatformMounter,
} from '@machinat/core/types';
import type { ServiceContainer } from '@machinat/core/service/types';
import type createNextServer from 'next';

export type NextServer = ReturnType<typeof createNextServer>;

export type NextServerOptions = Parameters<typeof createNextServer>[0];

export type NextMetadata = {
  source: 'next';
  request: {
    method: string;
    url: string;
    headers: IncomingHttpHeaders;
  };
};

type AcceptedNextResponse = {
  accepted: true;
  headers?: OutgoingHttpHeaders;
  page?: string;
  query?: {
    [key: string]: any;
  };
};

type UnacceptedNextResponse = {
  accepted: false;
  headers?: OutgoingHttpHeaders;
  code: number;
  reason: string;
};

export type NextResponse = AcceptedNextResponse | UnacceptedNextResponse;

export type NextEvent = {
  platform: 'next';
  kind: 'request';
  type: 'request';
  payload: {
    request: {
      method: string;
      url: string;
      headers: IncomingHttpHeaders;
    };
  };
};

export type NextChannel = {
  platform: string;
  type: string;
  uid: string;
};

export type NextEventContext = EventContext<
  NextChannel,
  null,
  NextEvent,
  NextMetadata,
  null
>;

export type NextEventMiddleware = EventMiddleware<
  NextEventContext,
  NextResponse
>;

export type NextModuleConfigs = {
  entryPath?: string;
  shouldPrepare?: boolean;
  nextAppOptions?: NextServerOptions;
  eventMiddlewares?: (
    | NextEventMiddleware
    | ServiceContainer<NextEventMiddleware>
  )[];
};

export type NextPlatformMounter = PlatformMounter<
  NextEventContext,
  NextResponse,
  any,
  any,
  any
>;
