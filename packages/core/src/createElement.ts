import { SOCIABLY_ELEMENT_TYPE } from './symbol';
import type {
  SociablyElementType,
  SociablyNode,
  SociablyElement,
} from './types';

const createSociablyElement = (
  type: SociablyElementType,
  config: any,
  ...children: Array<SociablyNode>
): SociablyElement<unknown, unknown> => {
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
    $$typeof: SOCIABLY_ELEMENT_TYPE,
  };
};

export default createSociablyElement;
