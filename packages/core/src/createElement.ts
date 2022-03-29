import { MACHINAT_ELEMENT_TYPE } from './symbol';
import type {
  MachinatElementType,
  MachinatNode,
  MachinatElement,
} from './types';

const createMachinatElement = (
  type: MachinatElementType,
  config: any,
  ...children: Array<MachinatNode>
): MachinatElement<unknown, unknown> => {
  const childrenLen = children.length;

  const props = config || {};
  if (childrenLen === 1) {
    props.children = children[0];
  } else if (childrenLen > 1) {
    props.children = children;
  }

  return {
    type,
    props,
    $$typeof: MACHINAT_ELEMENT_TYPE,
  };
};

export default createMachinatElement;
