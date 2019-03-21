// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatEvent } from 'machinat-base/types';

export type WebhookResponse = {|
  status: number,
  body: string | Object,
|};

export type WebhookHandler<Thread, Event: MachinatEvent<any, Thread>> = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => ?$ReadOnlyArray<Event>;
