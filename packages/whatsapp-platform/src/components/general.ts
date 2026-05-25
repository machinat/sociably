import type { GeneralElement, SociablyNode } from '@sociably/core';
import {
  makeTextSegment,
  type InnerRenderFn,
  type TextSegment,
} from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';
import invariant from 'invariant';

type GeneralComponentRenderer = (
  node: GeneralElement,
  path: string,
  render: InnerRenderFn,
) => null | TextSegment[] | Promise<null | TextSegment[]>;

const br: GeneralComponentRenderer = (
  node: GeneralElement,
  path: string,
): TextSegment[] => [makeTextSegment(node, path, '\n')];

const transormText =
  (
    tag: string,
    transformer: (value: string) => string,
  ): GeneralComponentRenderer =>
  async (
    node: GeneralElement,
    path: string,
    render: InnerRenderFn,
  ): Promise<null | TextSegment[]> => {
    const childrenSegments = await render(
      node.props.children as SociablyNode,
      '.children',
    );
    if (!childrenSegments) {
      return null;
    }

    for (const segment of childrenSegments) {
      if (segment.type !== 'text') {
        throw new TypeError(
          `non-textual node ${formatNode(segment.node)} is placed in <${tag}/>`,
        );
      }
    }

    return [
      makeTextSegment(node, path, transformer(childrenSegments[0].value)),
    ];
  };

const b = transormText('b', (value: string) => `*${value}*`);

const i = transormText('i', (value: string) => `_${value}_`);

const s = transormText('s', (value: string) => `~${value}~`);

const u = transormText('u', (value: string) => value);

const code = transormText('code', (value: string) => `\`\`\`${value}\`\`\``);

const pre = transormText('pre', (value: string) => `\`\`\`\n${value}\n\`\`\``);

const generalComponents = {
  b,
  i,
  s,
  u,
  code,
  pre,
  br,
};

const objectHasOwnProperty = (obj: object, prop: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const generalComponentDelegator = async (
  element: GeneralElement,
  path: string,
  render: InnerRenderFn,
): Promise<null | TextSegment[]> => {
  const { type } = element;

  invariant(
    objectHasOwnProperty(generalComponents, type),
    `"${type}" is not valid general component tag on WhatsApp platform`,
  );

  const segments = await generalComponents[
    type as keyof typeof generalComponents
  ](element, path, render);
  return segments;
};

export default generalComponentDelegator;
