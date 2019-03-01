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

export const appendURIField = (body: string, key: string, value: string) =>
  // eslint-disable-next-line prefer-template
  (body === '' ? body : body + '&') + key + '=' + encodeURIComponent(value);
