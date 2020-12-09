import type { HTTPRequestInfo, RoutingInfo } from '../types';

export interface WebhookMetadata {
  source: 'webhook';
  request: HTTPRequestInfo;
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
