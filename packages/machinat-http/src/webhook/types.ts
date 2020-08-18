import type { HTTPRequestInfo } from '../types';

export interface WebhookMetadata {
  source: 'webhook';
  request: HTTPRequestInfo;
}

export type WebhookHandler = (
  metadata: WebhookMetadata
) => Promise<{
  code: number;
  headers?: {
    [key: string]: string;
  };
  body?: string | any;
}>;
