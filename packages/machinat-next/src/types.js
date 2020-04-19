// @flow
import type {
  EventContext,
  EventMiddleware,
  PlatformMounter,
} from '@machinat/core/types';
import { ServiceContainer } from '@machinat/core/service/types';

export type NextMetadata = {|
  source: 'next',
  request: {|
    method: string,
    url: string,
    headers: {| [string]: string |},
  |},
|};

type AcceptedNextResponse = {|
  accepted: true,
  headers?: {| [string]: string |},
  page?: string,
  query?: {| [string]: any |},
|};

type UnacceptedNextResponse = {|
  accepted: false,
  headers?: {| [string]: string |},
  code: number,
  reason: string,
|};

export type NextResponse = AcceptedNextResponse | UnacceptedNextResponse;

export type NextEvent = {|
  platform: 'next',
  type: 'request',
  payload: {|
    request: {|
      method: string,
      url: string,
      headers: {| [string]: string |},
    |},
  |},
|};

export type NextChannel = {|
  platform: string,
  type: string,
  uid: string,
|};

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
  entryPath?: string,
  shouldPrepare?: boolean,
  nextAppOptions?: Object,
  eventMiddlewares?: (
    | NextEventMiddleware
    | ServiceContainer<NextEventMiddleware>
  )[],
};

export type NextPlatformMounter = PlatformMounter<
  NextEventContext,
  NextResponse,
  any,
  any,
  any
>;
