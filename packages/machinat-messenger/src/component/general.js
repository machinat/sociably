import {
  breakSegment,
  textSegment,
  wrapSingleUnitSegment,
} from 'machinat-renderer';
import { compose, joinTextualSegments } from 'machinat-utility';

import { mapSegmentValue } from './utils';

export const text = (node, render, path) =>
  joinTextualSegments(render(node.props.children, '.children'), node, path);

export const br = (node, _, path) => [breakSegment(node, path)];

const B = '*';
export const b = compose(
  mapSegmentValue(v => (typeof v === 'string' ? B + v + B : v)),
  text
);

const I = '_';
export const i = compose(
  mapSegmentValue(v => (typeof v === 'string' ? I + v + I : v)),
  text
);

const DEL = '~';
export const del = compose(
  mapSegmentValue(v => (typeof v === 'string' ? DEL + v + DEL : v)),
  text
);

const CODE = '`';
export const code = compose(
  mapSegmentValue(v => (typeof v === 'string' ? CODE + v + CODE : v)),
  text
);

const PRE_BEGIN = '```\n';
const PRE_END = '\n```';
export const pre = compose(
  mapSegmentValue(v => (typeof v === 'string' ? PRE_BEGIN + v + PRE_END : v)),
  text
);

export const a = (node, render, path) => {
  const { children, href } = node.props;
  const segments = render(children, '.children');
  if (segments === null) {
    return null;
  }

  const joined = joinTextualSegments(segments);
  const breakSeg = breakSegment(node, path);

  return [...joined, breakSeg, textSegment(href), breakSeg];
};

const generalMediaFactory = (tag, type) => {
  const box = {
    [tag]: ({ props: { src } }) => ({
      message: {
        attachment: {
          type,
          payload: {
            url: src,
          },
        },
      },
    }),
  };
  return wrapSingleUnitSegment(box[tag]);
};

export const img = generalMediaFactory('img', 'image');
export const video = generalMediaFactory('video', 'video');
export const audio = generalMediaFactory('audio', 'audio');
export const file = generalMediaFactory('file', 'file');
