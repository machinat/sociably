/* eslint-disable import/prefer-default-export */
import type { MachinatNode } from '@machinat/core/types';
import formatNode from '@machinat/core/utils/formatNode';
import { textSegment } from '@machinat/core/renderer';
import type { TextSegment } from '@machinat/core/renderer/types';
import { annotateMessengerComponent } from '../utils';
import type { MessengerComponent } from '../types';

/**
 * @category Props
 */
type LatexProps = {
  /** Texual node to be wrapped in the LATEX block. */
  children: MachinatNode;
};

/** @ignore */
const LATEX_BEGIN = '\\(';

/** @ignore */
const LATEX_END = '\\)';

/** @ignore */
const _Latex = async function Latex(node, path, render) {
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
    textSegment(node, path, LATEX_BEGIN),
    segments[0],
    textSegment(node, path, LATEX_END),
  ];
};
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
> = annotateMessengerComponent(_Latex);
