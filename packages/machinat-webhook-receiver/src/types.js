// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatEvent, MachinatMetadata } from 'machinat-base/types';

export type WebhookMetadata = {|
  source: 'webhook',
  request: {|
    method: string,
    url: string,
    headers: {| [string]: string |},
    body: string,
    encrypted: boolean,
  |},
|};

declare var t: WebhookMetadata;
(t: MachinatMetadata<'webhook'>);

export type WebhookEventReport<
  Channel,
  Event: MachinatEvent<any>,
  Response
> = {|
  channel: Channel,
  event: Event,
  response: void | Response,
|};

export type WebhookHandler<Channel, Event: MachinatEvent<any>, Response> = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => Promise<null | WebhookEventReport<Channel, Event, Response>[]>;

export type ResponsesHandler<Channel, Event: MachinatEvent<any>, Response> = (
  req: IncomingMessage,
  res: ServerResponse,
  events: WebhookEventReport<Channel, Event, Response>[]
) => Promise<void>;
