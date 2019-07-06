// @flow
import type { IncomingMessage, ServerResponse } from 'http';

export type NextMetadata = {|
  source: 'next',
  request: {|
    method: string,
    url: string,
    headers: {| [string]: string |},
    encrypted: boolean,
  |},
|};

export type NextParams = {
  pathname: string,
  query: {| [string]: any |},
};

export type NextEvent = {|
  platform: 'next',
  type: 'request',
  payload: {
    req?: IncomingMessage,
    res?: ServerResponse,
  },
|};
