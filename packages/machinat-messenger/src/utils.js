// @flow
import {
  annotateNativeComponent,
  wrapContainerComponent,
  wrapPartComponent,
  wrapUnitComponent,
} from '@machinat/core/renderer';
import joinTextualSegments from '@machinat/core/utils/joinTextualSegments';
import compose from '@machinat/core/utils/compose';
import type { GeneralElement } from '@machinat/core/types';
import type { InnerRenderFn } from '@machinat/core/renderer/types';

import type { MessengerSegmentValue } from './types';
import { MESSENGER, ENTRY_PATH } from './constant';

const { hasOwnProperty } = Object.prototype;
export const isMessageEntry = (value: string | MessengerSegmentValue) =>
  typeof value === 'string' || !hasOwnProperty.call(value, ENTRY_PATH);

export const asContainerComponent = compose<any>(
  annotateNativeComponent(MESSENGER),
  wrapContainerComponent
);

export const asPartComponent = compose<any>(
  annotateNativeComponent(MESSENGER),
  wrapPartComponent
);

export const asUnitComponent = compose<any>(
  annotateNativeComponent(MESSENGER),
  wrapUnitComponent
);

export const mapJoinedTextValues = (mapper: string => string) => async (
  node: GeneralElement,
  render: InnerRenderFn<any, any>,
  path: string
) => {
  const segments = await render(node.props.children, '.children');

  const joined = joinTextualSegments(segments, node, path);
  if (joined === null) {
    return null;
  }

  for (const segment of joined) {
    if (segment.type === 'text') {
      segment.value = mapper(segment.value);
    }
  }

  return joined;
};
