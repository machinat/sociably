import invariant from 'invariant';
import { formatNode } from '@sociably/core/utils';
import {
  makeTextSegment,
  makeUnitSegment,
  makeBreakSegment,
} from '@sociably/core/renderer';

const p = async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  for (const segment of childrenSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(segment.node)} is placed in <p/>`
      );
    }
  }

  return [
    makeBreakSegment(node, path),
    makeTextSegment(node, path, childrenSegments[0].value),
    makeBreakSegment(node, path),
  ];
};

const br = (node, path) => [makeTextSegment(node, path, '\n')];

const transormText = (tag, transformer) => async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  for (const segment of childrenSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(segment.node)} is placed in <${tag}/>`
      );
    }
  }

  return [makeTextSegment(node, path, transformer(childrenSegments[0].value))];
};

const b = transormText('b', (v) => `${v}`);

const i = transormText('i', (v) => `${v}`);

const s = transormText('s', (v) => `${v}`);

const u = transormText('u', (v) => v);

const code = transormText('code', (v) => `\`${v}\``);

const pre = transormText('pre', (v) => `\`\`\`\n${v}\n\`\`\``);

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

const renderGeneralComponents = async (element, render, path) => {
  const { type } = element;
  invariant(
    hasOwnProperty.call(generalComponents, type),
    `"${type}" is not a valid general component tag on Facebook platform`
  );

  const segments = await generalComponents[type](element, render, path);
  return segments;
};

export default renderGeneralComponents;
