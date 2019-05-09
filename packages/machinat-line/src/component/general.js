import { breakSegment, textSegment, wrapUnitSegment } from 'machinat-renderer';
import { joinTextualSegments } from 'machinat-utility';

export const text = (node, render, path) =>
  joinTextualSegments(render(node.props.children, '.children'), node, path);

export const br = (node, _, path) => [breakSegment(node, path)];

export const b = text;
export const i = text;
export const del = text;
export const code = text;
export const pre = text;

export const a = (node, render, path) => {
  const {
    props: { children, href },
  } = node;

  const segments = joinTextualSegments(
    render(children, '.children'),
    node,
    path
  );
  const breakSeg = breakSegment(node, path);

  return segments === null
    ? null
    : [...segments, breakSeg, textSegment(href, node, path), breakSeg];
};

const __media = wrapUnitSegment(({ props: { src } }) => [
  { type: 'text', text: src || '' },
]);

export const img = __media;
export const video = __media;
export const audio = __media;
export const file = __media;
