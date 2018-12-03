// @flow
import invariant from 'invariant';
import { isNative, isImmediate, isEmpty } from 'machinat-shared';
import { traverse } from 'machinat-children';

import type {
  MachinatNode,
  MachinatGeneralElement,
  MachinatNativeElement,
} from 'types/element';
import type { TraverseElementCallback } from 'machinat-children/types';

import JobSequence from './jobSequence';
import {
  appendResult,
  invariantNoSeparator,
  appendResultToLastBatch,
  appendSeparator,
} from './utils';

import type {
  RenderDelegate,
  RenderResult,
  ImmediateEle,
  RenderTraverseContext,
} from './types';

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

export default class MachinatRenderer<R: Object, J, N> {
  delegate: RenderDelegate<R, J, N>;
  oriented: string;

  constructor(orientedPlatform: string, delegate: RenderDelegate<R, J, N>) {
    this.delegate = delegate;
    this.oriented = orientedPlatform;
  }

  renderInner(elements: MachinatNode, prefix: string, payload: any) {
    return this._renderInnerImpl(prefix, payload, elements, '');
  }

  _renderJobSequenceTraverseCallback = this._makeRenderTraverseCallback(
    appendResultToLastBatch,
    appendSeparator
  );
  // TODO: Job sequence need further encapsulation
  renderJobSequence(elements: MachinatNode, payload: any): ?JobSequence<R, J> {
    if (isEmpty(elements)) {
      return undefined;
    }

    const accumulates = [];

    traverse(
      elements,
      RENDER_ROOT,
      { payload, accumulates },
      this._renderJobSequenceTraverseCallback
    );

    if (accumulates.length === 0) {
      return undefined;
    }

    return new JobSequence(
      accumulates,
      payload,
      this.delegate.createJobsFromRendered
    );
  }

  _renderInnerTraverseCallback = this._makeRenderTraverseCallback(
    appendResult,
    invariantNoSeparator
  );

  _renderInnerImpl(
    prefix: string,
    payload: any,
    elements: MachinatNode,
    currentPath: string
  ) {
    if (isEmpty(elements)) {
      return undefined;
    }

    const accumulates = [];
    traverse(
      elements,
      prefix + currentPath,
      { payload, accumulates },
      this._renderInnerTraverseCallback
    );

    return accumulates.length === 0 ? undefined : accumulates;
  }

  _makeRenderTraverseCallback<Acc>(
    handleRenderedResult: (RenderResult<R, N>, Acc) => void,
    handleSeparator: (ImmediateEle, Acc) => void
  ): TraverseElementCallback {
    const traversCallback = (
      element,
      path,
      context: RenderTraverseContext<any>
    ) => {
      const { accumulates, payload } = context;

      if (typeof element === 'string' || typeof element === 'number') {
        handleRenderedResult(
          { element: (element: string | number), value: element, path },
          accumulates
        );
      } else if (typeof element.type === 'string') {
        const value = this.delegate.renderGeneralElement(
          element,
          this._renderInnerImpl.bind(this, path, payload),
          payload,
          path
        );

        if (value) {
          handleRenderedResult(
            { element: (element: MachinatGeneralElement), value, path },
            accumulates
          );
        }
      } else if (isImmediate(element)) {
        handleSeparator(element, accumulates);
      } else if (this.delegate.isNativeComponent(element.type)) {
        const value = this.delegate.renderNativeElement(
          element,
          this._renderInnerImpl.bind(this, path, payload),
          payload,
          path
        );

        if (value) {
          handleRenderedResult(
            { element: (element: MachinatNativeElement<N>), value, path },
            accumulates
          );
        }
      } else if (typeof element.type === 'function') {
        invariant(
          !isNative(element),
          `Element ${
            element.type.name
          } at ${path} is native Component type of ${(typeof element.$$native ===
          'symbol'
            ? Symbol.keyFor(element.$$native)
            : element.$$native) || 'unknown'}, not supported by ${
            this.oriented
          }`
        );

        const { type: renderCustom, props } = element;
        const rendered = renderCustom(props, payload);

        traverse(
          rendered,
          path + RENDER_SEPARATOR + renderCustom.name,
          context,
          traversCallback
        );
      } else if (typeof element === 'object') {
        handleRenderedResult(
          { value: element, element: (undefined: void), path },
          accumulates
        );
      } else {
        invariant(false, `${element} at poistion ${path} is illegal`);
      }
    };

    return traversCallback;
  }
}
