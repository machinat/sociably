import type { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { makeTextSegment, TextSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import type { FacebookComponent } from '../types.js';

/**
 * @category Props
 */
export type LatexProps = {
  /** Texual node to be wrapped in the LATEX block. */
  children: SociablyNode;
};

const LATEX_BEGIN = '\\(';
const LATEX_END = '\\)';

/**
 * The receipt template allows you to send an order confirmation as a structured
 * message.
 * @category Component
 * @props {@link LatexProps}
 * @guides Check [help page](https://www.facebook.com/help/147348452522644).
 */
export const Latex: FacebookComponent<LatexProps, TextSegment> =
  makeFacebookComponent(async function Latex(node, path, render) {
    const segments = await render(node.props.children, '.children');
    if (segments === null) {
      return null;
    }

    for (const segment of segments) {
      if (segment.type !== 'text') {
        throw new TypeError(
          `non-textual node ${formatNode(
            segment.node
          )} received, only textual nodes allowed`
        );
      }
    }

    return [
      makeTextSegment(node, path, LATEX_BEGIN),
      segments[0] as TextSegment,
      makeTextSegment(node, path, LATEX_END),
    ];
  });
