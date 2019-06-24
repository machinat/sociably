// @flow
/* eslint-disable no-param-reassign */
import { SEGMENT_BREAK, MACHINAT_NATIVE_TYPE } from 'machinat';

import type { GeneralElement, NativeElement } from 'machinat/types';
import type {
  MachinatNativeComponent,
  RenderInnerFn,
  BreakSegment,
  TextSegment,
} from './types';

export const asNative = (sign: Symbol) => (
  Component: MachinatNativeComponent<any>
) => {
  Component.$$typeof = MACHINAT_NATIVE_TYPE;
  Component.$$native = sign;
  return Component;
};

export const asNamespace = (namespace: string) => (
  Component: MachinatNativeComponent<any>
) => {
  Component.$$namespace = namespace;
  return Component;
};

export const annotate = (key: string, val: any) => (
  Component: MachinatNativeComponent<any>
) => {
  Component[key] = val;
  return Component;
};

export const breakSegment = (
  node: GeneralElement | NativeElement<any>,
  path: string
): BreakSegment<any> => ({
  type: 'break',
  node,
  value: SEGMENT_BREAK,
  path,
});

export const textSegment = (
  text: string,
  node: GeneralElement | NativeElement<any>,
  path: string
): TextSegment<any> => ({
  type: 'text',
  node,
  value: text,
  path,
});

export const wrapSinglePartSegment = <Value>(
  _component: (
    NativeElement<any>,
    RenderInnerFn<Value, any>,
    string
  ) => null | Value
) => {
  const { name } = _component;

  const box = {
    [name]: (
      element: NativeElement<any>,
      render: RenderInnerFn<Value, any>,
      path: string
    ) => {
      const value = _component(element, render, path);
      if (value === null) {
        return null;
      }

      return [
        {
          type: 'part',
          node: element,
          value,
          path,
        },
      ];
    },
  };

  return box[name];
};

export const wrapSingleUnitSegment = <Value>(
  _component: (
    NativeElement<any>,
    RenderInnerFn<Value, any>,
    string
  ) => null | Value
) => {
  const { name } = _component;

  const box = {
    [name]: (
      element: NativeElement<any>,
      render: RenderInnerFn<Value, any>,
      path: string
    ) => {
      const value = _component(element, render, path);
      if (value === null) {
        return null;
      }

      return [
        {
          type: 'unit',
          node: element,
          value,
          path,
        },
      ];
    },
  };

  return box[name];
};
