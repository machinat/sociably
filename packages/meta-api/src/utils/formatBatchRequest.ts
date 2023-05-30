import { MetaBatchRequest, MetaApiJobRequest } from '../types.js';

const appendField = (body: string, key: string, value: string) =>
  `${body.length === 0 ? '' : `${body}&`}${key}=${encodeURIComponent(value)}`;

const encodeParams = (fields: { [key: string]: unknown }): string => {
  let body = '';

  for (const key of Object.keys(fields)) {
    const fieldValue = fields[key];

    if (fieldValue !== undefined) {
      body = appendField(
        body,
        key,
        typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
      );
    }
  }
  return body;
};

const formatRequestParams = (
  { method, url, params }: MetaApiJobRequest,
  accessToken: string
): MetaBatchRequest =>
  method === 'GET' || method === 'DELETE'
    ? {
        method,
        relative_url: `${url}?${encodeParams({
          ...params,
          access_token: accessToken,
        })}`,
        body: undefined,
      }
    : {
        method,
        relative_url: `${url}?${encodeParams({
          access_token: accessToken,
        })}`,
        body: params ? encodeParams(params) : undefined,
      };

export default formatRequestParams;
