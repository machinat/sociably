// @flow
import { MACHINAT_ELEMENT_TYPE } from 'machinat-symbol';
import type { MachinatElementType, MachinatNode } from './types';

export default function createElement(
  type: MachinatElementType,
  config: Object,
  ...children: Array<MachinatNode>
) {
  const childrenLen = children.length;

  const props = config || {};
  if (childrenLen === 1) {
    props.children = children[0]; // eslint-disable-line prefer-destructuring
  } else if (childrenLen > 1) {
    props.children = children;
  }

  return {
    type,
    props,
    $$typeof: MACHINAT_ELEMENT_TYPE,
  };
}
