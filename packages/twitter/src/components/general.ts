import {
  makeTextSegment,
  makeBreakSegment,
  makeUnitSegment,
  IntermediateSegment,
} from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';
import { TwitterSegmentValue } from '../types';

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

const unsuportedMedia = (node, path) => [
  makeBreakSegment(node, path),
  makeTextSegment(node, path, node.props.src),
  makeBreakSegment(node, path),
];

const img = (node, path) => [
  makeUnitSegment<TwitterSegmentValue>(node, path, {
    type: 'media',
    attachment: {
      type: 'photo',
      source: {
        type: 'url',
        url: node.props.src,
        parameters: {},
      },
    },
  }),
];

const video = (node, path) => [
  makeUnitSegment<TwitterSegmentValue>(node, path, {
    type: 'media',
    attachment: {
      type: 'video',
      source: {
        type: 'url',
        url: node.props.src,
        parameters: {},
      },
    },
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
  img,
  video,
  audio: unsuportedMedia,
  file: unsuportedMedia,
};

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const generalComponentDelegator = async (
  node,
  path,
  render
): Promise<IntermediateSegment<TwitterSegmentValue>[]> => {
  const { type } = node;

  if (!objectHasOwnProperty(generalComponents, type)) {
    throw new Error(
      `"${type}" is not a valid general component tag on Twitter platform`
    );
  }

  const segments = await generalComponents[type](node, path, render);
  return segments;
};

export default generalComponentDelegator;
