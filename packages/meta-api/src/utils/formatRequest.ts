import { MetaBatchRequest } from '../types';

const appendField = (body: string, key: string, value: string) =>
  `${body.length === 0 ? '' : `${body}&`}${key}=${encodeURIComponent(value)}`;

const encodeUriBody = (fields: { [key: string]: unknown }): string => {
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

const formatRequest = (
  request: MetaBatchRequest
): Omit<MetaBatchRequest, 'body'> & { body?: string } =>
  request.method === 'GET' || request.method === 'DELETE'
    ? {
        ...request,
        relative_url: request.body
          ? `${request.relative_url}?${encodeUriBody(request.body)}`
          : request.relative_url,
        body: undefined,
      }
    : {
        ...request,
        body: request.body ? encodeUriBody(request.body) : undefined,
      };

export default formatRequest;
