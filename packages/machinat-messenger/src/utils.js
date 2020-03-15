// @flow
import { annotateNativeComponent } from '@machinat/core/renderer';
import type { GeneralElement } from '@machinat/core/types';
import type { InnerRenderFn } from '@machinat/core/renderer/types';

import type { MessengerSegmentValue } from './types';
import { MESSENGER, ENTRY_PATH } from './constant';

const { hasOwnProperty } = Object.prototype;
export const isMessageEntry = (value: string | MessengerSegmentValue) =>
  typeof value === 'string' ||
  (typeof value === 'object' && !hasOwnProperty.call(value, ENTRY_PATH));

export const annotateMessengerComponent = annotateNativeComponent(MESSENGER);
