// @flow
import { inspect } from 'util';
import invariant from 'invariant';
import { isNative, isPause, isEmpty, isElement } from 'machinat-shared';
import { traverse } from 'machinat-children';

import type {
  MachinatNode,
  GeneralElement,
  NativeElement,
  PauseElement,
} from 'types/element';
import type { TraverseElementCallback } from 'machinat-children/types';

import type { RenderDelegate, InnerAction, RootAction } from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type RenderTraverseContext<R, N> =
  | {
      payload: any,
      accumulates: RootAction<R, N>[],
      asRoot: true,
    }
  | {
      payload: any,
      accumulates: InnerAction<R, N>[],
      asRoot: false,
    };

export default class MachinatRenderer<Action, Native> {
  delegate: RenderDelegate<Action, Native>;
  oriented: string;

  constructor(
    orientedPlatform: string,
    delegate: RenderDelegate<Action, Native>
  ) {
    this.delegate = delegate;
    this.oriented = orientedPlatform;
  }

  renderInner(
    elements: MachinatNode,
    prefix: string,
    payload: any
  ): null | InnerAction<Action, Native>[] {
    return this._renderInnerImpl(prefix, payload, elements, '');
  }

  renderRoot(
    elements: MachinatNode,
    payload: any
  ): null | RootAction<Action, Native>[] {
    if (isEmpty(elements)) {
      return null;
    }

    const accumulates: RootAction<Action, Native>[] = [];
    traverse(
      elements,
      RENDER_ROOT,
      { payload, accumulates, asRoot: true },
      this._traverseCallback
    );

    return accumulates.length === 0 ? null : accumulates;
  }

  _renderInnerImpl(
    prefix: string,
    payload: any,
    elements: MachinatNode,
    currentPath: string
  ): null | InnerAction<Action, Native>[] {
    if (isEmpty(elements)) {
      return null;
    }

    const accumulates: InnerAction<Action, Native>[] = [];
    traverse(
      elements,
      prefix + currentPath,
      { payload, accumulates, asRoot: false },
      this._traverseCallback
    );

    return accumulates.length === 0 ? null : accumulates;
  }

  _traverseCallback: TraverseElementCallback = (
    element,
    path,
    context: RenderTraverseContext<Action, Native>
  ) => {
    const { accumulates, payload, asRoot } = context;

    if (typeof element === 'string' || typeof element === 'number') {
      accumulates.push({
        isPause: false,
        element: (element: string | number),
        value: element,
        path,
      });
    } else if (typeof element.type === 'string') {
      const value = this.delegate.renderGeneralElement(
        element,
        this._renderInnerImpl.bind(this, path, payload),
        payload,
        path
      );

      if (value) {
        accumulates.push({
          isPause: false,
          element: (element: GeneralElement),
          value: (value: Action),
          path,
        });
      }
    } else if (isPause(element)) {
      invariant(
        asRoot,
        `<Pause /> should not be placed beneath native or general element props`
      );

      accumulates.push({
        isPause: true,
        element: (element: PauseElement),
        value: undefined,
        path,
      });
    } else if (this.delegate.isNativeComponent(element.type)) {
      const value = this.delegate.renderNativeElement(
        element,
        this._renderInnerImpl.bind(this, path, payload),
        payload,
        path
      );

      invariant(
        !asRoot || element.type.$$root,
        `${
          typeof element.type === 'function' ? element.type.name : element.type
        } is not legal root component`
      );

      if (value) {
        accumulates.push({
          isPause: false,
          element: (element: NativeElement<Native>),
          value,
          path,
        });
      }
    } else if (typeof element.type === 'function') {
      invariant(
        !isNative(element),
        `component ${element.type.name} at '${path}' is not supported by ${
          this.oriented
        }`
      );

      const { type: renderCustom, props } = element;
      const rendered = renderCustom(props, payload);

      traverse(
        rendered,
        path + RENDER_SEPARATOR + renderCustom.name,
        context,
        this._traverseCallback
      );
    } else if (typeof element === 'object' && !isElement(element)) {
      accumulates.push({
        isPause: false,
        value: element,
        element: (undefined: void),
        path,
      });
    } else {
      invariant(
        false,
        `element type ${inspect(element.type)} at poistion '${path}' is illegal`
      );
    }
  };
}
