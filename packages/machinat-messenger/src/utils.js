// @flow
import {
  asNative,
  asNamespace,
  wrapSinglePartSegment,
  wrapSingleUnitSegment,
} from 'machinat-renderer';
import { compose, joinTextualSegments } from 'machinat-utility';
import type { MachinatElement } from 'machinat/types';
import type { RenderInnerFn } from 'machinat-renderer/types';

import type { MessengerSegmentValue } from './types';
import {
  MESSENGER_NATIVE_TYPE,
  MESSENGER_NAMESPACE,
  ENTRY_PATH,
} from './constant';

const { hasOwnProperty } = Object.prototype;
export const isMessageValue = (value: string | MessengerSegmentValue) =>
  typeof value === 'string' || !hasOwnProperty.call(value, ENTRY_PATH);

export const asContainerComponent = compose<any>(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE)
);

export const asPartComponent = compose<any>(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE),
  wrapSinglePartSegment
);

export const asUnitComponent = compose<any>(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE),
  wrapSingleUnitSegment
);

export const mapJoinedTextValues = (mapper: string => string) => async (
  node: MachinatElement<string>,
  render: RenderInnerFn<any, any>,
  path: string
) => {
  const segments = await render((node.props.children: any), '.children');

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
