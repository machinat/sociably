import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import type { EventMiddleware, PlatformMounter } from '@machinat/core/types';
import type { MaybeContainer } from '@machinat/core/service/types';
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
  channel: null;
  user: null;
};

export type NextEventContext = {
  platform: 'next';
  event: NextEvent;
  metadata: NextMetadata;
  bot: null;
};

export type NextEventMiddleware = EventMiddleware<
  NextEventContext,
  NextResponse
>;

export type NextConfigs = {
  entryPath?: string;
  noPrepare?: boolean;
  serverOptions?: NextServerOptions;
  eventMiddlewares?: MaybeContainer<NextEventMiddleware>[];
};

export type NextPlatformMounter = PlatformMounter<
  NextEventContext,
  NextResponse,
  never,
  never,
  never
>;
