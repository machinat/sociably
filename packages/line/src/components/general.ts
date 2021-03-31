/** @internal */ /** */
import { unitSegment, textSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import formatNode from '@machinat/core/utils/formatNode';
import type { LineSegmentValue } from '../types';

const p = async (node, path, render) => {
  const contentRendered = await render(node.props.children, '.children');
  if (contentRendered === null) {
    return null;
  }

  const segments: UnitSegment<LineSegmentValue>[] = [];

  for (const segment of contentRendered) {
    if (segment.type === 'text') {
      segments.push({
        type: 'unit',
        value: { type: 'text', text: segment.value },
        node,
        path,
      });
    } else {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual node and <br/> allowed`
      );
    }
  }

  return segments;
};

const br = (node, path) => [textSegment(node, path, '\n')];

const plainText = async (node, path, render) => {
  const contentSegments = await render(node.props.children, '.children');
  if (!contentSegments) {
    return null;
  }

  for (const segment of contentSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes allowed`
      );
    }
  }

  return [textSegment(node, path, contentSegments[0].value)];
};

const media = (node, path) => [
  unitSegment(node, path, {
    type: 'text',
    text: node.props.src || '',
  }),
];

const generalComponents = {
  p,
  br,
  b: plainText,
  i: plainText,
  s: plainText,
  u: plainText,
  code: plainText,
  pre: plainText,
  img: media,
  video: media,
  audio: media,
  file: media,
};

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const generalComponentDelegator = async (node, path, render) => {
  const { type } = node;

  if (!objectHasOwnProperty(generalComponents, type)) {
    throw new Error(
      `"${type}" is not valid general component tag on messenger`
    );
  }

  const segments = await generalComponents[type](node, path, render);
  return segments;
};

export default generalComponentDelegator;
