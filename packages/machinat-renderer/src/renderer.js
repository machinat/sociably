// @flow
import invariant from 'invariant';
import {
  isNative,
  isPause,
  isEmpty,
  isElement,
  formatElement,
  traverse,
} from 'machinat-utility';
import { SEGMENT_BREAK } from 'machinat-symbol';

import type {
  MachinatNode,
  PauseElement,
  GeneralElement,
  NativeElement,
} from 'machinat/types';
import type { TraverseElementCallback } from 'machinat-utility/types';

import type {
  RenderInnerFn,
  MachinatSegment,
  MachinatNativeType,
} from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type RenderTraverseContext<R, N> = {
  allowPause: boolean,
  atSurface: boolean,
  segments: MachinatSegment<R, N>[],
};

type ComponentFn<Value> = (
  props: Object,
  render: RenderInnerFn
) => null | Value[];

type TextComponentFn = ComponentFn<string>;

type GeneralComponentDelegate<Value> = {
  text: TextComponentFn,
  a: TextComponentFn,
  b: TextComponentFn,
  i: TextComponentFn,
  del: TextComponentFn,
  code: TextComponentFn,
  pre: TextComponentFn,
  img: ComponentFn<Value>,
  video: ComponentFn<Value>,
  audio: ComponentFn<Value>,
  file: ComponentFn<Value>,
  [string]: ComponentFn<string | Value>,
};

const invariantElementAsUnit = (
  atSurface: boolean,
  element: NativeElement<any>
) => {
  invariant(
    !atSurface || element.type.$$unit,
    `${formatElement(
      element
    )} is not a valid unit to be sent and should not be placed at surface level`
  );
};

export default class MachinatRenderer<
  Value,
  Native: MachinatNativeType<Value>
> {
  platform: string;
  nativeSign: Symbol;
  generalComponentDelegate: GeneralComponentDelegate<Value>;

  constructor(
    platform: string,
    nativeSign: Symbol,
    generalComponentDelegate: GeneralComponentDelegate<Value>
  ) {
    this.platform = platform;
    this.nativeSign = nativeSign;
    this.generalComponentDelegate = generalComponentDelegate;
  }

  render(
    elements: MachinatNode,
    allowPause: boolean
  ): null | MachinatSegment<Value, Native>[] {
    return this._renderImpl('', allowPause, true, elements, RENDER_ROOT);
  }

  _isNativeComponent(Component: Function) {
    return Component.$$native === this.nativeSign;
  }

  _renderImpl(
    prefix: string,
    allowPause: boolean,
    atSurface: boolean,
    elements: MachinatNode,
    currentPath: string
  ): null | MachinatSegment<Value, Native>[] {
    if (isEmpty(elements)) {
      return null;
    }

    const segments: MachinatSegment<Value, Native>[] = [];
    traverse(
      elements,
      prefix + currentPath,
      { segments, allowPause, atSurface },
      this._traverseCallback
    );

    return segments.length === 0 ? null : segments;
  }

  _traverseCallback: TraverseElementCallback = (
    element,
    path,
    context: RenderTraverseContext<Value, Native>
  ) => {
    const { segments, allowPause, atSurface } = context;

    if (typeof element === 'string' || typeof element === 'number') {
      // handle string or number as a node
      segments.push({
        isPause: false,
        asUnit: true,
        element: (element: string | number),
        value: typeof element === 'string' ? element : String(element),
        path,
      });
    } else if (typeof element.type === 'string') {
      // handle GeneralElement
      const { props, type } = element;
      invariant(
        type in this.generalComponentDelegate,
        `${formatElement(element)} is not valid general element supported in ${
          this.platform
        }`
      );

      const values = this.generalComponentDelegate[type](
        props,
        this._renderImpl.bind(this, `${path}#${type}`, false, false)
      );

      if (values !== null) {
        for (let i = 0; i < values.length; i += 1) {
          const value = values[i];

          if (!atSurface || value !== SEGMENT_BREAK) {
            segments.push({
              isPause: false,
              asUnit: true,
              element: (element: GeneralElement),
              value,
              path,
            });
          }
        }
      }
    } else if (isPause(element)) {
      // handle PauseElement
      invariant(
        allowPause,
        `${formatElement(element)} at ${path} is not allowed`
      );

      segments.push({
        isPause: true,
        asUnit: true,
        element: (element: PauseElement),
        value: undefined,
        path,
      });
    } else if (typeof element === 'object' && !isElement(element)) {
      // handle raw object passed as a node

      segments.push({
        isPause: false,
        asUnit: true,
        value: (element: Object),
        element: (undefined: void),
        path,
      });
    } else if (typeof element.type === 'function') {
      if (this._isNativeComponent(element.type)) {
        // handle NativeElement
        invariantElementAsUnit(atSurface, element);

        const { type: Component, props } = (element: NativeElement<Native>);
        const pathInner = `${path}#${Component.name}`;

        if (Component.$$container) {
          // container native component returns segments, just add them
          const containedSegments = Component(
            props,
            this._renderImpl.bind(this, pathInner, allowPause, false)
          );

          if (containedSegments) {
            for (let i = 0; i < containedSegments.length; i += 1) {
              const segment = containedSegments[i];
              const { element: newSegElement, value: newSegValue } = segment;

              if (isElement(newSegElement) && isNative(newSegElement)) {
                invariantElementAsUnit(atSurface, newSegElement);
              }

              if (!atSurface || newSegValue !== SEGMENT_BREAK) {
                segments.push(segment);
              }
            }
          }
        } else {
          // handle value native components
          const values = Component(
            props,
            this._renderImpl.bind(this, pathInner, false, false)
          );

          if (values !== null) {
            for (let i = 0; i < values.length; i += 1) {
              const value = values[i];

              if (!atSurface || value !== SEGMENT_BREAK) {
                segments.push({
                  isPause: false,
                  asUnit: Component.$$unit,
                  element: (element: NativeElement<Native>),
                  value,
                  path,
                });
              }
            }
          }
        }
      } else {
        // handle element with custom functional component type
        invariant(
          !isNative(element),
          `native component ${formatElement(
            element
          )} at '${path}' is not supported by ${this.platform}`
        );

        const { type: renderCustom, props } = element;
        const rendered = renderCustom(props);

        traverse(
          rendered,
          path + RENDER_SEPARATOR + renderCustom.name,
          context,
          this._traverseCallback
        );
      }
    } else {
      // throw if invalid element met
      invariant(
        false,
        `${formatElement(element)} at poistion '${path}' is not valid element`
      );
    }
  };
}
