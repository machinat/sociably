// @flow
import invariant from 'invariant';
import { Children, Utils } from 'machinat-shared';

import type { ElementReducer } from 'machinat-shared/types';
import type { MachinatNode } from 'types/element';
import type MachinatQueue from 'machinat-queue';
import type { RenderDelegate } from './types';

const { isNative } = Utils;
const { reduce } = Children;

const RENDER_PREFIX = '#';

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

  renderRoots(elements: MachinatNode) {
    reduce();
  }

  _renderInternal = (elements: MachinatNode, prefix: string, context: any) =>
    reduce(elements, this._renderRuducer, [], prefix, context);

  _renderRuducer: ElementReducer<Array<Rendered>> = (
    renderedArr,
    element,
    prefix,
    context
  ) => {
    let result = renderedArr;

    if (typeof element === 'string' || typeof element === 'number') {
      result.push({
        element,
        rendered: element,
      });
    } else if (typeof element.type === 'string') {
      const rendered = this.delegate.renderGeneralElement(
        element,
        this._renderInternal,
        prefix,
        context
      );
      result.push({ rendered, element });
    } else if (this.delegate.isNativeElementType(element.type)) {
      const rendered = this.delegate.renderNativeElement(
        element,
        this._renderInternal,
        prefix,
        context
      );
      result.push({ rendered, element });
    } else if (typeof element.type === 'function') {
      invariant(
        !isNative(element),
        `Element at ${prefix} is native type of ${(typeof element.$$native ===
        // $FlowFixMe: remove this after symbol primitive supported
        'symbol'
          ? Symbol.keyFor(element.$$native)
          : element.$$native) || 'Unknown'}, which not supported by ${
          this.oriented
        }`
      );

      const { type: renderCustom, props } = element;

      const rendered = renderCustom(props, context);
      result = reduce(
        rendered,
        this._renderRuducer,
        result,
        prefix + RENDER_PREFIX + renderCustom.name,
        context
      );
    } else {
      invariant(
        false,
        `The element type of ${element} at poistion ${prefix} is illegal for rendering`
      );
    }

    return result;
  };
}
