/* eslint-disable import/prefer-default-export */
import { textSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const Emoji = (node, path) => [
  textSegment(node, path, String.fromCodePoint(node.props.code), node, path),
];

annotateLineComponent(Emoji);
