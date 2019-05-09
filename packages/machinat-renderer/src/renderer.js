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

import type {
  MachinatNode,
  NativeElement,
  GeneralElement,
} from 'machinat/types';
import type { TraverseNodeCallback } from 'machinat-utility/types';

import type {
  RenderInnerFn,
  MachinatSegment,
  MachinatNativeComponent,
  InnerSegment,
} from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type RenderTraverseContext<Value, Native> = {
  allowPause: boolean,
  atSurface: boolean,
  segments: InnerSegment<Value, Native>[],
};

type GeneralComponentDelegate<Value, Native> = (
  element: GeneralElement,
  render: RenderInnerFn<Value, Native>,
  path: string
) => null | InnerSegment<Value, Native>[];

const pushRenderedSegment = <Value, Native: MachinatNativeComponent<Value>>(
  segments: InnerSegment<Value, Native>[],
  rendered: InnerSegment<Value, Native>[],
  allowPause: boolean,
  atSurface: boolean
) => {
  for (let i = 0; i < rendered.length; i += 1) {
    const segment = rendered[i];
    const { type } = segment;

    invariant(
      !atSurface || type !== 'part',
      `${formatNode(
        segment.node
      )} is a part element and should not be placed at surface level`
    );

    invariant(
      allowPause || type !== 'pause',
      `<Pause /> at ${segment.path} is not allowed`
    );

    if (!atSurface || type !== 'break') {
      segments.push(segment);
    }
  }
};

export default class MachinatRenderer<
  Value,
  Native: MachinatNativeComponent<Value>
> {
  platform: string;
  nativeSign: Symbol;
  generalDelegate: GeneralComponentDelegate<Value, Native>;

  constructor(
    platform: string,
    nativeSign: Symbol,
    generalDelegate: GeneralComponentDelegate<Value, Native>
  ) {
    this.platform = platform;
    this.nativeSign = nativeSign;
    this.generalDelegate = generalDelegate;
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
  ): null | InnerSegment<Value, Native>[] {
    if (isEmpty(node)) {
      return null;
    }

    const segments: InnerSegment<Value, Native>[] = [];
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
        type: 'text',
        node,
        value: typeof node === 'string' ? node : String(node),
        path,
      });
    } else if (typeof node.type === 'string') {
      // handle GeneralElement

      const renderedSegments = this.generalDelegate(
        node,
        this._renderImpl.bind(this, `${path}#${node.type}`, allowPause, false),
        path
      );

      if (renderedSegments !== null) {
        pushRenderedSegment(segments, renderedSegments, allowPause, atSurface);
      }
    } else if (isPause(node)) {
      // handle PauseElement
      invariant(allowPause, `<Pause /> at ${path} is not allowed`);

      segments.push({
        type: 'pause',
        node,
        value: undefined,
        path,
      });
    } else if (typeof node === 'object' && !isElement(node)) {
      // handle raw object passed as a node

      segments.push({
        type: 'raw',
        value: (node: any),
        node: undefined,
        path,
      });
    } else if (typeof node.type === 'function') {
      if (this._isNativeComponent(node.type)) {
        // handle NativeElement

        const { type: Component } = (node: NativeElement<Native>);
        const pathInner = `${path}#${Component.name}`;

        const renderedSegments = Component(
          node,
          this._renderImpl.bind(this, pathInner, allowPause, false),
          path
        );

        if (renderedSegments) {
          pushRenderedSegment(
            segments,
            renderedSegments,
            allowPause,
            atSurface
          );
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
