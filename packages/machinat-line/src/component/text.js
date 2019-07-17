/* eslint-disable import/prefer-default-export */
import { textSegment } from 'machinat-renderer';
import { asContainerComponent } from '../utils';

const Emoji = async (node, _, path) => [
  textSegment(String.fromCodePoint(node.props.code), node, path),
];

const __Emoji = asContainerComponent(Emoji);

export { __Emoji as Emoji };
