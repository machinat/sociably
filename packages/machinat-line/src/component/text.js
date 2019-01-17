/* eslint-disable import/prefer-default-export */
import { annotate, asNative, asUnit } from 'machinat-utility';
import { LINE_NAITVE_TYPE } from '../symbol';

export const Emoji = ({ code }) => [String.fromCodePoint(code)];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(Emoji);
