// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatEvent } from 'machinat-base/types';

export type WebhookResponse = {|
  status: number,
  body: string | Object,
|};

export type WebhookHandler<Raw, Thread> = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => ?$ReadOnlyArray<MachinatEvent<Raw, Thread>>;
