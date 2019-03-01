// @flow
import type { ActionWithoutPause } from 'machinat-base/types';
import type { LineActionValue, LineComponent } from '../types';

export const makeMessageFromString = (text: string) => ({
  type: 'text',
  text,
});

export const isMessage = (
  element: $ElementType<
    ActionWithoutPause<LineActionValue, LineComponent>,
    'element'
  >
): boolean %checks =>
  typeof element !== 'object' ||
  typeof element.type !== 'function' ||
  element.type.$$entry === undefined;
