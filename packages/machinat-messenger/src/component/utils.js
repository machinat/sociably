import {
  asNative,
  asNamespace,
  annotate,
  wrapSinglePartSegment,
  wrapSingleUnitSegment,
} from 'machinat-renderer';
import { compose, joinTextualSegments } from 'machinat-utility';

import {
  MESSENGER_NATIVE_TYPE,
  MESSENGER_NAMESPACE,
  ENTRY_MESSAGES,
} from '../constant';

export const asContainerComponent = compose(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE)
);

export const asSinglePartComponent = compose(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE),
  wrapSinglePartSegment
);

export const asSingleUnitComponentWithEntry = entry =>
  compose(
    asNative(MESSENGER_NATIVE_TYPE),
    asNamespace(MESSENGER_NAMESPACE),
    annotate('$$entry', entry),
    wrapSingleUnitSegment
  );

export const asSingleMessageUnitComponent = asSingleUnitComponentWithEntry(
  ENTRY_MESSAGES
);

export const mapJoinedTextualValues = mapper => async (node, render, path) => {
  const segments = await render(node.props.children, '.children');
  if (segments === null) {
    return null;
  }

  const joined = joinTextualSegments(segments, node, path);

  for (const segment of joined) {
    segment.value = mapper(segment.value);
  }

  return joined;
};
