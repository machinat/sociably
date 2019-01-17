// @flow
import { MACHINAT_ELEMENT_TYPE } from 'machinat-utility';
import type { MachinatElementType, MachinatNode } from 'types/element';

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
    // $FlowFixMe ok until we have better way labeling native type
  };
}
