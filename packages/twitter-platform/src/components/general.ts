import type { GeneralElement, SociablyNode } from '@sociably/core';
import {
  makeTextSegment,
  type InnerRenderFn,
  type TextSegment,
} from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';

const br = (node: GeneralElement, path: string): TextSegment[] => [
  makeTextSegment(node, path, '\n'),
];

const plainText =
  (tag: string) =>
  async (
    node: GeneralElement,
    path: string,
    render: InnerRenderFn,
  ): Promise<null | TextSegment[]> => {
    const contentSegments = await render(
      node.props.children as SociablyNode,
      '.children',
    );
    if (!contentSegments) {
      return null;
    }

    for (const segment of contentSegments) {
      if (segment.type !== 'text') {
        throw new TypeError(
          `non-textual node ${formatNode(segment.node)} is placed in <${tag}/>`,
        );
      }
    }

    return [makeTextSegment(node, path, contentSegments[0].value)];
  };

const generalComponents = {
  br,
  b: plainText('b'),
  i: plainText('i'),
  s: plainText('s'),
  u: plainText('u'),
  code: plainText('code'),
  pre: plainText('pre'),
};

const objectHasOwnProperty = (obj: object, prop: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const generalComponentDelegator = async (
  node: GeneralElement,
  path: string,
  render: InnerRenderFn,
): Promise<null | TextSegment[]> => {
  const { type } = node;

  if (!objectHasOwnProperty(generalComponents, type)) {
    throw new Error(
      `"${type}" is not a valid general component tag on Twitter platform`,
    );
  }

  const segments = await generalComponents[
    type as keyof typeof generalComponents
  ](node, path, render);
  return segments;
};

export default generalComponentDelegator;
