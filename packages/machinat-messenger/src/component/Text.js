/* eslint-disable import/prefer-default-export */
import { annotate, asNative, asUnit } from 'machinat-utility';

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
