import type { GeneralElement, SociablyNode } from '@sociably/core';
import {
  makeTextSegment,
  type InnerRenderFn,
  type TextSegment,
} from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';

type GeneralComponentTag = 'br' | 'b' | 'i' | 's' | 'u' | 'code' | 'pre';
type GeneralComponentFn = (
  node: GeneralElement,
  path: string,
  render: InnerRenderFn,
) => TextSegment[] | Promise<null | TextSegment[]>;

const br: GeneralComponentFn = (node, path) => [
  makeTextSegment(node, path, '\n'),
];

const plainText =
  (tag: Exclude<GeneralComponentTag, 'br'>): GeneralComponentFn =>
  async (node, path, render) => {
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

const generalComponents: Record<GeneralComponentTag, GeneralComponentFn> = {
  br,
  b: plainText('b'),
  i: plainText('i'),
  s: plainText('s'),
  u: plainText('u'),
  code: plainText('code'),
  pre: plainText('pre'),
};

const objectHasOwnProperty = <Obj extends object, Prop extends PropertyKey>(
  obj: Obj,
  prop: Prop,
): prop is Prop & keyof Obj => Object.prototype.hasOwnProperty.call(obj, prop);

const generalComponentDelegator = async (
  node: GeneralElement,
  path: string,
  render: InnerRenderFn,
) => {
  const { type } = node;

  if (!objectHasOwnProperty(generalComponents, type)) {
    throw new Error(
      `"${type}" is not a valid general component tag on LINE platform`,
    );
  }

  return generalComponents[type](node, path, render);
};

export default generalComponentDelegator;
