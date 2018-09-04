// @flow
import invariant from 'invariant';
import { Children, Utils } from 'machinat-shared';
import type { TraverseElementCallback } from 'machinat-shared/types';
import type { MachinatNode, MachinatElement } from 'types/element';
import type MachinatQueue from 'machinat-queue';

import {
  addImmediatelyAsSeparator,
  addToAccumulates,
  addToLastBatchOfAccumulates,
} from './utils';
import { ExecutionError } from './errors';
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
  context: Object;

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
    return this._renderImpl(prefix, payload, elements, '');
  }

  renderSequence(elements: MachinatNode, payload: any) {
    if (isEmpty(elements)) {
      return undefined;
    }

    const { context } = this;
    context.payload = payload;
    context.accumulates = ([]: BatchesAndSeparators);
    context.handleRenderedResult = addToLastBatchOfAccumulates;
    context.handleImmediately = addImmediatelyAsSeparator;

    traverse(elements, RENDER_ROOT, context, this._renderTraverseCallback);

    const { accumulates } = context;
    return accumulates.length === 0 ? undefined : accumulates;
  }

  async executeSequence(queue: MachinatQueue, resultSequence) {
    const result = [];

    for (let i = 0; i < resultSequence.length; i += 1) {
      const action = resultSequence[i];
      if (isImmediately(action)) {
        const { after } = action.props;
        if (after && typeof after === 'function') {
          await after(); // eslint-disable-line no-await-in-loop
        } else {
          invariant(
            !after,
            `"after" prop of Immediately element should be a function, got ${after}`
          );
        }
      } else {
        const jobs = this.delegate.createJobsFromRendered(action);

        // eslint-disable-next-line no-await-in-loop
        const { error, jobsResult } = await queue.enqueueJobAndWait(jobs);
        result.push(...jobsResult);

        if (error) {
          throw new ExecutionError(error, result);
        }
      }
    }
    return result;
  }

  _renderImpl = (
    prefix: string,
    payload: any,
    elements: MachinatNode,
    currentPath: string
  ) => {
    if (isEmpty(elements)) {
      return undefined;
    }

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
    const { accumulates } = context;
    return accumulates.length === 0 ? undefined : accumulates;
  };

  _renderTraverseCallback: TraverseElementCallback = (
    element,
    prefix,
    context: RenderTraverseContext<any>
  ) => {
    const { payload, handleRenderedResult, handleImmediately } = context;

    if (typeof element === 'string' || typeof element === 'number') {
      handleRenderedResult(
        {
          element,
          rendered: element,
          path: prefix,
        },
        context
      );
    } else if (typeof element.type === 'string') {
      const rendered = this.delegate.renderGeneralElement(
        element,
        this._renderImpl.bind(this, prefix, payload),
        payload,
        prefix
      );
      handleRenderedResult({ rendered, element, path: prefix }, context);
    } else if (isImmediately(element) && handleImmediately) {
      handleImmediately(element, context);
    } else if (this.delegate.isNativeComponent(element.type)) {
      const rendered = this.delegate.renderNativeElement(
        element,
        this._renderImpl.bind(this, prefix, payload),
        payload,
        prefix
      );
      handleRenderedResult({ rendered, element, path: prefix }, context);
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
