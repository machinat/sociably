// @flow
import type { MessengerRequest } from './types';

export const appendField = (body: string, key: string, value: string) =>
  `${body.length === 0 ? body : `${body}&`}${key}=${encodeURIComponent(value)}`;

export const encodeURIBody = (fields: { [string]: any }): string => {
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

export const formatRequest = (request: MessengerRequest) => ({
  ...request,
  body: encodeURIBody(request.body),
});
