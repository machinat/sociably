import { SOCIABLY_NATIVE_TYPE } from '../symbol.js';
import type {
  GeneralElement,
  NativeElement,
  NativeComponent,
  PauseDelayFn,
} from '../types.js';
import type {
  BreakSegment,
  TextSegment,
  PartSegment,
  UnitSegment,
  PauseSegment,
} from './types.js';

export const makeNativeComponent =
  (platform: string) =>
  <Component extends NativeComponent<unknown, any>>(
    componentFn: Component['$$render'],
  ): Component =>
    Object.defineProperties({} as Component, {
      $$typeof: {
        value: SOCIABLY_NATIVE_TYPE,
      },
      $$name: {
        value: componentFn.name,
      },
      $$platform: {
        value: platform,
      },
      $$render: {
        value: componentFn,
      },
    });

export const makeBreakSegment = (
  node: GeneralElement | NativeElement<unknown, any>,
  path: string,
): BreakSegment => ({
  type: 'break',
  node,
  value: null,
  path,
});

export const makeTextSegment = (
  node: GeneralElement | NativeElement<unknown, any>,
  path: string,
  text: string,
): TextSegment => ({
  type: 'text',
  node,
  value: text,
  path,
});

export const makePartSegment = <Value>(
  node: GeneralElement | NativeElement<unknown, any>,
  path: string,
  value: Value,
): PartSegment<Value> => ({
  type: 'part',
  node,
  value,
  path,
});

export const makeUnitSegment = <Value>(
  node: GeneralElement | NativeElement<unknown, any>,
  path: string,
  value: Value,
): UnitSegment<Value> => ({
  type: 'unit',
  node,
  value,
  path,
});

export const makePauseSegment = (
  node: GeneralElement | NativeElement<unknown, any>,
  path: string,
  value?: PauseDelayFn,
): PauseSegment => ({
  type: 'pause',
  node,
  value: value || null,
  path,
});
