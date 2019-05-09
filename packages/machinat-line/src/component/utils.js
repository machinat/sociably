import { compose } from 'machinat-utility';
import {
  asNative,
  asNamespace,
  annotate,
  wrapPartSegment,
  wrapUnitSegment,
} from 'machinat-renderer';

import { LINE_NAMESPACE, LINE_NATIVE_TYPE } from '../constant';

export const asContainerComponent = compose(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE)
);

export const asPartComponent = compose(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE),
  wrapPartSegment
);

export const asMessageUnitComponent = compose(
  asNative(LINE_NATIVE_TYPE),
  asNamespace(LINE_NAMESPACE),
  wrapUnitSegment
);

export const asUnitComponentWithEntryGetter = entry =>
  compose(
    asNative(LINE_NATIVE_TYPE),
    asNamespace(LINE_NAMESPACE),
    annotate('$$getEntry', entry),
    wrapUnitSegment
  );
