import { MACHINAT_ELEMENT_TYPE } from './symbol';
import type {
  MachinatElementType,
  MachinatNode,
  MachinatElement,
} from './types';

const createElement = (
  type: MachinatElementType,
  config: any,
  ...children: Array<MachinatNode>
): MachinatElement<any, any> => {
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
};

export default createElement;
