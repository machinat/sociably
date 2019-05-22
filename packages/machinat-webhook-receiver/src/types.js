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

export type WebhookEventReport<Thread, Event: MachinatEvent<any>> = {
  thread: Thread,
  event: Event,
  shouldRespond: boolean,
};

export type WebhookHandler<Thread, Event: MachinatEvent<any>> = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => ?$ReadOnlyArray<WebhookEventReport<Thread, Event>>;
