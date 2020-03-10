import invariant from 'invariant';
import {
  breakSegment,
  textSegment,
  wrapUnitComponent,
} from '@machinat/core/renderer';
import joinTextualSegments from '@machinat/core/utils/joinTextualSegments';

const text = async (node, render, path) => {
  const segments = await render(node.props.children, '.children');
  return joinTextualSegments(segments, node, path);
};
const br = (node, _, path) => [breakSegment(node, path)];

const b = text;
const i = text;
const del = text;
const code = text;
const pre = text;

const __media = wrapUnitComponent(({ src }) => ({
  type: 'text',
  text: src || '',
}));

const img = __media;
const video = __media;
const audio = __media;
const file = __media;

const generalComponents = {
  text,
  br,
  b,
  i,
  del,
  code,
  pre,
  img,
  video,
  audio,
  file,
};

const { hasOwnProperty } = Object.prototype;

const generalComponentDelegate = async (node, render, path) => {
  const { type } = node;

  invariant(
    hasOwnProperty.call(generalComponents, type),
    `"${type}" is not valid general component tag on messenger`
  );

  const segments = await generalComponents[type](node, render, path);
  return segments;
};

export default generalComponentDelegate;
