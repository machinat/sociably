// @flow
import compose from '@machinat/core/utils/compose';
import {
  annotateNativeComponent,
  wrapContainerComponent,
  wrapPartComponent,
  wrapUnitComponent,
} from '@machinat/core/renderer';
import type { LineSegmentValue } from './types';

import { LINE, CHANNEL_API_CALL_GETTER } from './constant';

export const asContainerComponent = compose<any>(
  annotateNativeComponent(LINE),
  wrapContainerComponent
);

export const asPartComponent = compose<any>(
  annotateNativeComponent(LINE),

  wrapPartComponent
);

export const asUnitComponent = compose<any>(
  annotateNativeComponent(LINE),
  wrapUnitComponent
);

export const isMessageValue = (
  value: string | LineSegmentValue
): boolean %checks =>
  typeof value === 'string' ||
  !Object.prototype.hasOwnProperty.call(value, CHANNEL_API_CALL_GETTER);
