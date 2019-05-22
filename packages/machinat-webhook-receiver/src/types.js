// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatEvent, MachinatTransport } from 'machinat-base/types';

export type WebhookResponse = {|
  status: number,
  body: string | Object,
|};

export type WebhookTransport = {|
  source: 'webhook',
  context: any,
|};

declare var t: WebhookTransport;
(t: MachinatTransport<'webhook'>);

export type WebhookEventReport<Channel, Event: MachinatEvent<any>> = {
  channel: Channel,
  event: Event,
  shouldRespond: boolean,
};

export type WebhookHandler<Channel, Event: MachinatEvent<any>> = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => ?$ReadOnlyArray<WebhookEventReport<Channel, Event>>;
