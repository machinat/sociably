import invariant from 'invariant';
import {
  breakSegment,
  textSegment,
  wrapSingleUnitSegment,
} from 'machinat-renderer';
import { joinTextualSegments } from 'machinat-utility';

import { mapJoinedTextValues } from '../utils';

const identity = x => x;
const text = mapJoinedTextValues(identity);

const br = (node, _, path) => [breakSegment(node, path)];

const B = '*';
const b = mapJoinedTextValues(v => B + v + B);

const I = '_';
const i = mapJoinedTextValues(v => I + v + I);

const DEL = '~';
const del = mapJoinedTextValues(v => DEL + v + DEL);

const CODE = '`';
const code = mapJoinedTextValues(v => CODE + v + CODE);

const PRE_BEGIN = '```\n';
const PRE_END = '\n```';
const pre = mapJoinedTextValues(v => PRE_BEGIN + v + PRE_END);

const a = async (node, render, path) => {
  const { children, href } = node.props;
  const segments = await render(children, '.children');
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

const img = generalMediaFactory('img', 'image');
const video = generalMediaFactory('video', 'video');
const audio = generalMediaFactory('audio', 'audio');
const file = generalMediaFactory('file', 'file');

const generalComponents = {
  text,
  b,
  i,
  del,
  code,
  pre,
  a,
  br,
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
