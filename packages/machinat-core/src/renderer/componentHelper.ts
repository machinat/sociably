import { MACHINAT_NATIVE_TYPE } from '../symbol';
import type {
  GeneralElement,
  NativeElement,
  NativeComponent,
  PauseUntilFn,
} from '../types';
import type {
  BreakSegment,
  TextSegment,
  PartSegment,
  UnitSegment,
  PauseSegment,
} from './types';

export const annotateNativeComponent = (platform: string) => (
  Component: NativeComponent<any, any>
): NativeComponent<any, any> =>
  Object.defineProperties(Component, {
    $$typeof: { value: MACHINAT_NATIVE_TYPE },
    $$platform: { value: platform },
  });

export const breakSegment = (
  node: GeneralElement | NativeElement<any, any, any>,
  path: string
): BreakSegment => ({
  type: 'break',
  node,
  value: null,
  path,
});

export const textSegment = (
  node: GeneralElement | NativeElement<any, any, any>,
  path: string,
  text: string
): TextSegment => ({
  type: 'text',
  node,
  value: text,
  path,
});

export const partSegment = <Value>(
  node: GeneralElement | NativeElement<any, Value, any>,
  path: string,
  value: Value
): PartSegment<Value> => ({
  type: 'part',
  node,
  value,
  path,
});

export const unitSegment = <Value>(
  node: GeneralElement | NativeElement<any, Value, any>,
  path: string,
  value: Value
): UnitSegment<Value> => ({
  type: 'unit',
  node,
  value,
  path,
});

export const pauseSegment = <Value>(
  node: GeneralElement | NativeElement<any, Value, any>,
  path: string,
  value?: PauseUntilFn
): PauseSegment => ({
  type: 'pause',
  node,
  value: value || null,
  path,
});
