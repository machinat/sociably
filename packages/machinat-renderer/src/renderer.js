// @flow
import invariant from 'invariant';
import {
  isNative,
  isPause,
  isEmpty,
  isElement,
  formatNode,
  traverse,
} from 'machinat-utility';
import { SEGMENT_BREAK } from 'machinat';

import type {
  MachinatNode,
  PauseElement,
  GeneralElement,
  NativeElement,
} from 'machinat/types';
import type { TraverseNodeCallback } from 'machinat-utility/types';

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
    `${formatNode(
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
    node: MachinatNode,
    allowPause: boolean
  ): null | MachinatSegment<Value, Native>[] {
    return this._renderImpl('', allowPause, true, node, RENDER_ROOT);
  }

  _isNativeComponent(Component: Function) {
    return Component.$$native === this.nativeSign;
  }

  _renderImpl(
    prefix: string,
    allowPause: boolean,
    atSurface: boolean,
    node: MachinatNode,
    currentPath: string
  ): null | MachinatSegment<Value, Native>[] {
    if (isEmpty(node)) {
      return null;
    }

    const segments: MachinatSegment<Value, Native>[] = [];
    traverse(
      node,
      prefix + currentPath,
      { segments, allowPause, atSurface },
      this._traverseCallback
    );

    return segments.length === 0 ? null : segments;
  }

  _traverseCallback: TraverseNodeCallback = (
    node,
    path,
    context: RenderTraverseContext<Value, Native>
  ) => {
    const { segments, allowPause, atSurface } = context;

    if (typeof node === 'string' || typeof node === 'number') {
      // handle string or number as a node
      segments.push({
        isPause: false,
        asUnit: true,
        node: (node: string | number),
        value: typeof node === 'string' ? node : String(node),
        path,
      });
    } else if (typeof node.type === 'string') {
      // handle GeneralElement
      const { props, type } = node;
      invariant(
        type in this.generalComponentDelegate,
        `${formatNode(node)} is not valid general element supported in ${
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
              node: (node: GeneralElement),
              value,
              path,
            });
          }
        }
      }
    } else if (isPause(node)) {
      // handle PauseElement
      invariant(allowPause, `${formatNode(node)} at ${path} is not allowed`);

      segments.push({
        isPause: true,
        asUnit: true,
        node: (node: PauseElement),
        value: undefined,
        path,
      });
    } else if (typeof node === 'object' && !isElement(node)) {
      // handle raw object passed as a node

      segments.push({
        isPause: false,
        asUnit: true,
        value: (node: Object),
        node: (undefined: void),
        path,
      });
    } else if (typeof node.type === 'function') {
      if (this._isNativeComponent(node.type)) {
        // handle NativeElement
        invariantElementAsUnit(atSurface, node);

        const { type: Component, props } = (node: NativeElement<Native>);
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
              const { node: newSegNode, value: newSegValue } = segment;

              if (isElement(newSegNode) && isNative(newSegNode)) {
                invariantElementAsUnit(atSurface, newSegNode);
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
                  node: (node: NativeElement<Native>),
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
          !isNative(node),
          `native component ${formatNode(
            node
          )} at '${path}' is not supported by ${this.platform}`
        );

        const { type: renderCustom, props } = node;
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
        `${formatNode(node)} at poistion '${path}' is not valid element`
      );
    }
  };
}
