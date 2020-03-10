/* eslint-disable import/prefer-default-export */
import { textSegment, annotateNativeComponent } from '@machinat/core/renderer';
import { LINE } from '../constant';

const Emoji = async (node, _, path) => [
  textSegment(String.fromCodePoint(node.props.code), node, path),
];

const __Emoji = annotateNativeComponent(LINE)(Emoji);

export { __Emoji as Emoji };
