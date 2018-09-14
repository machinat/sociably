// @flow
import invariant from 'invariant';
import { Children, Utils } from 'machinat-shared';
import type { TraverseElementCallback } from 'machinat-shared/types';
import type { MachinatNode, MachinatElement } from 'types/element';

import {
  addImmediatelyAsSeparator,
  addToAccumulates,
  addToLastBatchOfAccumulates,
} from './utils';
import type { RenderDelegate, RenderResult } from './types';

const { isNative, isImmediately, isEmpty } = Utils;
const { traverse } = Children;

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

type ImmediatelyEle = MachinatElement<Symbol>;
type RenderResultBatch = Array<RenderResult<any>>;
type BatchesAndSeparators = Array<RenderResultBatch | ImmediatelyEle>;
type RenderTraverseContext<C: RenderResultBatch | BatchesAndSeparators> = {
  payload: any,
  accumulates: C,
  handleRenderedResult: (RenderResult<any>, RenderTraverseContext<C>) => void,
  handleImmediately: (ImmediatelyEle, RenderTraverseContext<C>) => void,
};

export default class Renderer<Rendered, Job> {
  delegate: RenderDelegate<Rendered, Job>;
  oriented: string;

  constructor(
    orientedPlatform: string,
    delegate: RenderDelegate<Rendered, Job>
  ) {
    this.delegate = delegate;
    this.oriented = orientedPlatform;
  }

  render(elements: MachinatNode, prefix: string, payload: any) {
    return this._renderImpl(prefix, payload, elements, '');
  }

  renderJobSequence(
    elements: MachinatNode,
    payload: any
  ): ?Array<Array<Job> | ImmediatelyEle> {
    if (isEmpty(elements)) {
      return undefined;
    }

    const accumulates = [];

    traverse(
      elements,
      RENDER_ROOT,
      {
        payload,
        accumulates,
        handleRenderedResult: addToLastBatchOfAccumulates,
        handleImmediately: addImmediatelyAsSeparator,
      },
      this._renderTraverseCallback
    );

    if (accumulates.length === 0) {
      return undefined;
    }

    const jobSequence = new Array(accumulates.length);
    for (let i = 0; i < accumulates.length; i += 1) {
      const action = accumulates[i];
      jobSequence[i] = isImmediately(action)
        ? action
        : this.delegate.createJobsFromRendered(action, payload);
    }
    return jobSequence;
  }

  _renderImpl(
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
      {
        payload,
        accumulates,
        handleRenderedResult: addToAccumulates,
        handleImmediately: null,
      },
      this._renderTraverseCallback
    );
    return accumulates.length === 0 ? undefined : accumulates;
  }

  _renderTraverseCallback: TraverseElementCallback = (
    element,
    prefix,
    context: RenderTraverseContext<any>
  ) => {
    const {
      accumulates,
      payload,
      handleRenderedResult,
      handleImmediately,
    } = context;

    if (typeof element === 'string' || typeof element === 'number') {
      handleRenderedResult(
        {
          element,
          rendered: element,
          path: prefix,
        },
        accumulates
      );
    } else if (typeof element.type === 'string') {
      const rendered = this.delegate.renderGeneralElement(
        element,
        this._renderImpl.bind(this, prefix, payload),
        payload,
        prefix
      );
      handleRenderedResult({ rendered, element, path: prefix }, accumulates);
    } else if (isImmediately(element) && handleImmediately) {
      handleImmediately(element, accumulates);
    } else if (this.delegate.isNativeComponent(element.type)) {
      const rendered = this.delegate.renderNativeElement(
        element,
        this._renderImpl.bind(this, prefix, payload),
        payload,
        prefix
      );
      handleRenderedResult({ rendered, element, path: prefix }, accumulates);
    } else if (typeof element.type === 'function') {
      invariant(
        !isNative(element),
        `Element at ${prefix} is native Component type ${(typeof element.$$native ===
        // $FlowFixMe: remove me after symbol primitive supported
        'symbol'
          ? Symbol.keyFor(element.$$native)
          : element.$$native) || 'Unknown'}, which not supported by ${
          this.oriented
        }`
      );

      const { type: renderCustom, props } = element;

      const rendered = renderCustom(props, payload);
      traverse(
        rendered,
        prefix + RENDER_SEPARATOR + renderCustom.name,
        context,
        this._renderTraverseCallback
      );
    } else {
      invariant(
        false,
        `The element type of ${element} at poistion ${prefix} is illegal for rendering`
      );
    }
  };
}
