import moxy from 'moxy';
import { map } from 'machinat-utility';

const render = moxy(
  node =>
    map(node, element =>
      typeof element === 'string' || typeof element === 'number'
        ? { element, value: String(element) }
        : {
            node: element,
            value: element.type(element.props, render)[0],
          }
    ) || null
);

export default render;
