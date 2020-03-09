// @flow
import type { MachinatMetadata } from '@machinat/core/types';

export type WebhookMetadata = {|
  source: 'webhook',
  request: {|
    method: string,
    url: string,
    headers: {| [string]: string |},
    body: void | string,
  |},
|};

declare var t: WebhookMetadata;
(t: MachinatMetadata<'webhook'>);

export type WebhookHandler = (
  metadata: WebhookMetadata
) => Promise<{
  code: number,
  headers?: {| [string]: string |},
  body?: string | Object,
}>;
