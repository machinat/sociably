// @flow
import { MACHINAT_ELEMENT_TYPE } from 'machinat-shared';
import type { MachinatElementType, MachinatNode } from 'types/element';

export default function createElement(
  type: MachinatElementType,
  config: Object,
  ...children: Array<MachinatNode>
) {
  const props = config || {};
  if (children.length === 1) {
    props.children = children[0]; // eslint-disable-line prefer-destructuring
  } else if (children.length > 1) {
    props.children = children;
  }
  return {
    type,
    props,
    $$typeof: MACHINAT_ELEMENT_TYPE,
    // $FlowFixMe ok until we have better way labeling native type
    $$native: type && type.$$native,
  };
}
