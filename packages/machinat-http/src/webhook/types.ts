export interface WebhookMetadata {
  source: 'webhook';
  request: {
    method: string;
    url: string;
    headers: { [key: string]: string };
    body: void | string;
  };
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
