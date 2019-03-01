/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { annotate, asNative, asUnit, joinTextValues } from 'machinat-utility';

import { compose, map } from './utils';
import { text } from './general';

import { MESSENGER_NAITVE_TYPE } from '../symbol';

const LATEX_BEGIN = '\\(';
const LATEX_END = '\\)';

export const Latex = compose(
  map(v => (typeof v === 'string' ? LATEX_BEGIN + v + LATEX_END : v)),
  text
);

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(true))(Latex);

export const DynamicText = ({ children, fallback }, render) => {
  const rendered = joinTextValues(children, render, '.children');

  if (rendered === undefined) {
    return null;
  }

  invariant(
    rendered.length === 1 && typeof rendered[0] === 'string',
    '<br/> is invalid with in children of DynamicText'
  );

  return [{ dynamic_text: { text: rendered[0], fallback_text: fallback } }];
};
