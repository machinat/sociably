import { SEGMENT_BREAK } from 'machinat';
import { joinTextValues } from 'machinat-utility';

import { compose, map } from './utils';

export const text = ({ children }, render) =>
  joinTextValues(children, render, '.children') || null;

export const br = () => [SEGMENT_BREAK];

const B = '*';
export const b = compose(
  map(v => (typeof v === 'string' ? B + v + B : v)),
  text
);

const I = '_';
export const i = compose(
  map(v => (typeof v === 'string' ? I + v + I : v)),
  text
);

const DEL = '~';
export const del = compose(
  map(v => (typeof v === 'string' ? DEL + v + DEL : v)),
  text
);

const CODE = '`';
export const code = compose(
  map(v => (typeof v === 'string' ? CODE + v + CODE : v)),
  text
);

const PRE_BEGIN = '```\n';
const PRE_END = '\n```';
export const pre = compose(
  map(v => (typeof v === 'string' ? PRE_BEGIN + v + PRE_END : v)),
  text
);

export const a = ({ children, href }, render) => {
  const values = joinTextValues(children, render, '.children');
  return values === undefined
    ? null
    : [...values, SEGMENT_BREAK, href, SEGMENT_BREAK];
};

const generalMediaFactory = (tag, type) =>
  ({
    [tag]: props => [
      {
        message: {
          attachment: {
            type,
            payload: {
              url: props.src,
            },
          },
        },
      },
    ],
  }[tag]);

export const img = generalMediaFactory('img', 'image');
export const video = generalMediaFactory('video', 'video');
export const audio = generalMediaFactory('audio', 'audio');
export const file = generalMediaFactory('file', 'file');
