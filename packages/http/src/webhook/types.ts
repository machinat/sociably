import type { HttpRequestInfo, RoutingInfo } from '../types.js';

export type WebhookMetadata = {
  source: 'webhook';
  request: HttpRequestInfo;
};

export type WebhookHandler = (
  metadata: WebhookMetadata,
  routingInfo: RoutingInfo,
) => Promise<{
  code: number;
  headers?: Record<string, string>;
  body?: string | unknown;
}>;
