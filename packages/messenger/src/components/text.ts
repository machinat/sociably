import type { MachinatNode } from '@machinat/core';
import formatNode from '@machinat/core/utils/formatNode';
import { makeTextSegment, TextSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';
import type { MessengerComponent } from '../types';

/**
 * @category Props
 */
export type LatexProps = {
  /** Texual node to be wrapped in the LATEX block. */
  children: MachinatNode;
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
export const Latex: MessengerComponent<
  LatexProps,
  TextSegment
> = annotateMessengerComponent(async function Latex(node, path, render) {
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
