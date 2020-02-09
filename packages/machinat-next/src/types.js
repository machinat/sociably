// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { BotPlugin } from 'machinat-base/types';
import type NextBot from './bot';

export type NextMetadata = {|
  source: 'next',
  request: {|
    method: string,
    url: string,
    headers: {| [string]: string |},
    encrypted: boolean,
  |},
|};

export type AcceptedResponse = {
  accepted: true,
  page: string,
  query: {| [string]: any |},
};

export type UnacceptedResponse = {
  accepted: false,
  code: number,
  reason: string,
};

type AcceptedNextResponse = {|
  accepted: true,
  headers: {| [string]: string |},
  page?: string,
  query?: {| [string]: any |},
|};

type UnacceptedNextResponse = {|
  accepted: false,
  code: number,
  message: string,
|};

export type NextResponse = AcceptedNextResponse | UnacceptedNextResponse;

export type NextEvent = {|
  platform: 'next',
  type: 'request',
  payload: {
    req?: IncomingMessage,
    res?: ServerResponse,
  },
|};

export type NextChannel = {|
  platform: string,
  type: string,
  uid: string,
|};

export type NextPlugin = BotPlugin<
  NextChannel,
  null,
  NextEvent,
  NextMetadata,
  NextResponse,
  void,
  any,
  void,
  void,
  void,
  NextBot
>;

export type NextBotOptions = {|
  nextApp: any,
  shouldPrepare: boolean,
  // NOTE: next does not support serving under sub path now, so we
  //       have to hack the path by ourself.
  //       Follow https://github.com/zeit/next.js/issues/4998
  basePath?: string,
  plugins?: NextPlugin[],
|};
