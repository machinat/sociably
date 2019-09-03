// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatMetadata } from 'machinat/types';

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

export type WebhookEventReport<Channel, User, Event, Response> = {|
  channel: Channel,
  event: Event,
  user: User,
  response: void | Response,
|};

export type WebhookHandler<Channel, User, Event, Response> = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => Promise<null | WebhookEventReport<Channel, User, Event, Response>[]>;

export type ResponsesHandler<Channel, User, Event, Response> = (
  req: IncomingMessage,
  res: ServerResponse,
  events: WebhookEventReport<Channel, User, Event, Response>[]
) => Promise<void>;
