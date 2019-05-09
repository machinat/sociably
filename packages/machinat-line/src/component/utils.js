import { compose } from 'machinat-utility';
import {
  asNative,
  asNamespace,
  annotate,
  wrapSinglePartSegment,
  wrapSingleUnitSegment,
} from 'machinat-renderer';

import { LINE_NAMESPACE, LINE_NATIVE_TYPE } from '../constant';

export const asContainerComponent = compose(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE)
);

export const asSinglePartComponent = compose(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE),
  wrapSinglePartSegment
);

export const asSingleMessageUnitComponent = compose(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE),
  wrapSingleUnitSegment
);

export const asSingleUnitComponentWithEntryGetter = entry =>
  compose(
    asNative(LINE_NATIVE_TYPE),
    asNamespace(LINE_NAMESPACE),
    annotate('$$getEntry', entry),
    wrapSingleUnitSegment
  );
