// @flow
import { compose } from 'machinat-utility';
import {
  asNative,
  asNamespace,
  wrapSinglePartSegment,
  wrapSingleUnitSegment,
} from 'machinat-renderer';
import type { LineSegmentValue } from './types';

import { LINE_NAMESPACE, LINE_NATIVE_TYPE, ENTRY_GETTER } from './constant';

const { hasOwnProperty } = Object.prototype;

export const isMessageValue = (value: string | LineSegmentValue) =>
  typeof value === 'string' || !hasOwnProperty.call(value, ENTRY_GETTER);

export const asContainerComponent = compose<any>(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE)
);

export const asPartComponent = compose<any>(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE),
  wrapSinglePartSegment
);

export const asUnitComponent = compose<any>(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE),
  wrapSingleUnitSegment
);
