/** @internal */ /** */
import invariant from 'invariant';
import formatNode from '@machinat/core/utils/formatNode';
import { makeTextSegment, makeUnitSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { MessageValue } from '../types';

const p = async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  const segments: UnitSegment<MessageValue>[] = [];
  for (const segment of childrenSegments) {
    if (segment.type === 'text') {
      segments.push({
        type: 'unit',
        value: { message: { text: segment.value } },
        node,
        path,
      });
    } else {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes and <br/> allowed`
      );
    }
  }

  return segments;
};

const br = (node, path) => [makeTextSegment(node, path, '\n')];

const transormText = (transformer) => async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  for (const segment of childrenSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes allowed`
      );
    }
  }

  return [makeTextSegment(node, path, transformer(childrenSegments[0].value))];
};

const b = transormText((v) => `*${v}*`);

const i = transormText((v) => `_${v}_`);

const s = transormText((v) => `~${v}~`);

const u = transormText((v) => v);

const code = transormText((v) => `\`${v}\``);

const pre = transormText((v) => `\`\`\`\n${v}\n\`\`\``);

const generalMediaFactory = (type) => (node, path) => [
  makeUnitSegment(node, path, {
    message: {
      attachment: {
        type,
        payload: {
          url: node.props.src,
        },
      },
    },
  }),
];

const img = generalMediaFactory('image');
const video = generalMediaFactory('video');
const audio = generalMediaFactory('audio');
const file = generalMediaFactory('file');

const generalComponents = {
  p,
  b,
  i,
  s,
  u,
  code,
  pre,
  br,
  img,
  video,
  audio,
  file,
};

const { hasOwnProperty } = Object.prototype;

const generalComponentDelegator = async (element, render, path) => {
  const { type } = element;
  invariant(
    hasOwnProperty.call(generalComponents, type),
    `"${type}" is not valid general component tag on messenger`
  );

  const segments = await generalComponents[type](element, render, path);
  return segments;
};

export default generalComponentDelegator;
