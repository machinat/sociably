// @flow
import type { ActionWithoutPause } from 'machinat-base/types';
import type { MessengerActionValue, MessengerComponent } from '../types';

export const isMessage = (
  element: $ElementType<
    ActionWithoutPause<MessengerActionValue, MessengerComponent>,
    'element'
  >
): boolean %checks =>
  typeof element !== 'object' ||
  typeof element.type === 'string' ||
  element.type.$$entry === undefined;

export const appendField = (body: string, key: string, value: string) =>
  // eslint-disable-next-line prefer-template
  (body === '' ? body : body + '&') + key + '=' + encodeURIComponent(value);

export const appendFields = (prefix: string, fields: { [string]: any }) => {
  let body = prefix;

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
