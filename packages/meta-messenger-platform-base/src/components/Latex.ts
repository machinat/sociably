import type {
  SociablyNode,
  NativeElement,
  AnyNativeComponent,
} from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import {
  makeTextSegment,
  TextSegment,
  InnerRenderFn,
} from '@sociably/core/renderer';

/** @category Props */
export type LatexProps = {
  /** Texual node to be wrapped in the LATEX block. */
  children: SociablyNode;
};

const LATEX_BEGIN = '\\(';
const LATEX_END = '\\)';

export async function Latex(
  node: NativeElement<LatexProps, AnyNativeComponent>,
  path: string,
  render: InnerRenderFn,
): Promise<null | TextSegment[]> {
  const segments = await render(node.props.children, '.children');
  if (segments === null) {
    return null;
  }

  for (const segment of segments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node,
        )} received, only textual nodes allowed`,
      );
    }
  }

  return [
    makeTextSegment(node, path, LATEX_BEGIN),
    segments[0] as TextSegment,
    makeTextSegment(node, path, LATEX_END),
  ];
}
