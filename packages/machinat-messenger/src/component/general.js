import invariant from 'invariant';
import {
  breakSegment,
  textSegment,
  wrapUnitComponent,
} from '@machinat/core/renderer';
import joinTextualSegments from '@machinat/core/utils/joinTextualSegments';

import { mapJoinedTextValues } from '../utils';

const identity = x => x;
const text = mapJoinedTextValues(identity);

const br = (node, render, path) => [breakSegment(node, path)];

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

const generalMediaFactory = (tag, type) => {
  const box = {
    [tag]: ({ src }) => ({
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

  return wrapUnitComponent(box[tag]);
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
  br,
  img,
  video,
  audio,
  file,
};

const { hasOwnProperty } = Object.prototype;

const generalComponentDelegate = async (element, render, path) => {
  const { type } = element;
  invariant(
    hasOwnProperty.call(generalComponents, type),
    `"${type}" is not valid general component tag on messenger`
  );

  const segments = await generalComponents[type](element, render, path);
  return segments;
};

export default generalComponentDelegate;
