import type { HttpRequestInfo, RoutingInfo } from '../types.js';

export interface WebhookMetadata {
  source: 'webhook';
  request: HttpRequestInfo;
}

export type WebhookHandler = (
  metadata: WebhookMetadata,
  routingInfo?: RoutingInfo
) => Promise<{
  code: number;
  headers?: {
    [key: string]: string;
  };
  body?: string | unknown;
}>;
