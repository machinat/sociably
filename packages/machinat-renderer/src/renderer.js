// @flow
import invariant from 'invariant';
import { Children, Utils } from 'machinat-shared';

import type { TraverseElementCallback } from 'machinat-shared/types';
import type { MachinatNode, MachinatElement } from 'types/element';
import type MachinatQueue from 'machinat-queue';
import type { RenderDelegate, RenderResult } from './types';

const { isNative, isImmediately } = Utils;
const { traverse } = Children;

const RENDER_SEPARATOR = '#';
const RENDER_ROOT = '$';

const addToAccumulates = (result, context) => {
  context.accumulates.push(result);
};

const addToLastBatchOfAccumulates = (result, context) => {
  const { accumulates } = context;
  let lastBatch;
  if (
    accumulates.length === 0 ||
    !Array.isArray(accumulates[accumulates.length - 1])
  ) {
    lastBatch = [];
    accumulates.push(lastBatch);
  } else {
    lastBatch = accumulates[accumulates.length - 1];
  }
  lastBatch.push(result);
};

const addImmediatelyAsSeparator = (immediately, context) => {
  const { after } = immediately.props;
  invariant(
    !after || typeof after === 'function',
    `props.after of Immediately element should be a function, got ${after}`
  );
  context.accumulates.push(immediately);
};

type ImmediatelyEle = MachinatElement<Symbol>;
type RenderResultBatch = Array<RenderResult<any>>;
type BatchesAndSeparators = Array<RenderResultBatch | ImmediatelyEle>;
type RenderTraverseContext<C: RenderResultBatch | BatchesAndSeparators> = {
  payload: any,
  accumulates: C,
  handleRenderedResult: ?(RenderResult<any>, RenderTraverseContext<C>) => void,
  handleImmediately: ?(ImmediatelyEle, RenderTraverseContext<C>) => void,
};

export default class Renderer<Rendered, Job> {
  delegate: RenderDelegate<Rendered, Job>;
  oriented: string;
  context: RenderTraverseContext<any>;

  constructor(
    orientedPlatform: string,
    delegate: RenderDelegate<Rendered, Job>
  ) {
    this.delegate = delegate;
    this.oriented = orientedPlatform;
    this.context = {
      payload: null,
      accumulates: null,
      handleRenderedResult: null,
      handleImmediately: null,
    };
  }

  render(elements: MachinatNode, prefix: string, payload: any) {
    return this._renderImpl(prefix, elements, '', payload);
  }

  renderSequence(elements: MachinatNode, payload: any) {
    const { context } = this;
    context.payload = payload;
    context.accumulates = ([]: BatchesAndSeparators);
    context.handleRenderedResult = addToLastBatchOfAccumulates;
    context.handleImmediately = addImmediatelyAsSeparator;

    traverse(elements, RENDER_ROOT, context, this._renderTraverseCallback);
    return context.accumulates;
  }

  _renderImpl = (
    prefix: string,
    elements: MachinatNode,
    currentPath: string,
    payload: any
  ) => {
    const { context } = this;
    context.payload = payload;
    context.accumulates = ([]: RenderResultBatch);
    context.handleRenderedResult = addToAccumulates;
    context.handleImmediately = null;

    traverse(
      elements,
      prefix + currentPath,
      context,
      this._renderTraverseCallback
    );
    return context.accumulates;
  };

  _renderTraverseCallback: TraverseElementCallback = (
    element,
    prefix,
    context
  ) => {
    const { payload, handleRenderedResult, handleImmediately } = context;

    if (typeof element === 'string' || typeof element === 'number') {
      handleRenderedResult(
        {
          element,
          rendered: element,
        },
        context
      );
    } else if (typeof element.type === 'string') {
      const rendered = this.delegate.renderGeneralElement(
        element,
        this._renderImpl.bind(this, prefix),
        payload,
        prefix
      );
      handleRenderedResult({ rendered, element }, context);
    } else if (isImmediately(element) && handleImmediately) {
      handleImmediately(element, context);
    } else if (this.delegate.isNativeElementType(element.type)) {
      const rendered = this.delegate.renderNativeElement(
        element,
        this._renderImpl.bind(this, prefix),
        payload,
        prefix
      );
      handleRenderedResult({ rendered, element }, context);
    } else if (typeof element.type === 'function') {
      invariant(
        !isNative(element),
        `Element at ${prefix} is native type of ${(typeof element.$$native ===
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
