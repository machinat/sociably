import {
  makeUnitSegment,
  makeTextSegment,
  makeBreakSegment,
} from '@machinat/core/renderer';
import { formatNode } from '@machinat/core/utils';

const p = async (node, path, render) => {
  const contentSegments = await render(node.props.children, '.children');
  if (contentSegments === null) {
    return null;
  }

  for (const segment of contentSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(segment.node)} is placed in <p/>`
      );
    }
  }

  return [
    makeBreakSegment(node, path),
    makeTextSegment(node, path, contentSegments[0].value),
    makeBreakSegment(node, path),
  ];
};

const br = (node, path) => [makeTextSegment(node, path, '\n')];

const plainText = (tag) => async (node, path, render) => {
  const contentSegments = await render(node.props.children, '.children');
  if (!contentSegments) {
    return null;
  }

  for (const segment of contentSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(segment.node)} is placed in <${tag}/>`
      );
    }
  }

  return [makeTextSegment(node, path, contentSegments[0].value)];
};

const media = (node, path) => [
  makeUnitSegment(node, path, {
    type: 'text',
    text: node.props.src || '',
  }),
];

const generalComponents = {
  p,
  br,
  b: plainText('b'),
  i: plainText('i'),
  s: plainText('s'),
  u: plainText('u'),
  code: plainText('code'),
  pre: plainText('pre'),
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
