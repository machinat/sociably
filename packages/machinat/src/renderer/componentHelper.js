// @flow
import { MACHINAT_NATIVE_TYPE } from '../symbol';
import type { GeneralElement, NativeElement, NativeComponent } from '../types';
import type { InnerRenderFn, BreakSegment, TextSegment } from './types';

export const asNativeComponent = (platform: string) => (
  Component: NativeComponent<any, any>
) =>
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
  value: undefined,
  path,
});

export const textSegment = (
  text: string,
  node: GeneralElement | NativeElement<any, any, any>,
  path: string
): TextSegment => ({
  type: 'text',
  node,
  value: text,
  path,
});

export const wrapSinglePartSegment = <Value>(
  _component: (
    NativeElement<any, any, any>,
    InnerRenderFn<Value, any>,
    string
  ) => null | Value
) => {
  const { name } = _component;

  const box = {
    [name]: async (
      element: NativeElement<any, any, any>,
      render: InnerRenderFn<Value, any>,
      path: string
    ) => {
      const value = await _component(element, render, path);
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
    NativeElement<any, any, any>,
    InnerRenderFn<Value, any>,
    string
  ) => null | Value
) => {
  const { name } = _component;

  const box = {
    [name]: async (
      element: NativeElement<any, any, any>,
      render: InnerRenderFn<Value, any>,
      path: string
    ) => {
      const value = await _component(element, render, path);
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
