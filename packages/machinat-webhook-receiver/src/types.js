// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatEvent, MachinatMetadata } from 'machinat-base/types';

export type WebhookResponse = {|
  status: number,
  body: string | Object,
|};

export type WebhookMetadata = {|
  source: 'webhook',
  context: any,
|};

declare var t: WebhookMetadata;
(t: MachinatMetadata<'webhook'>);

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
