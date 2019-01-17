import moxy from 'moxy';
import { map } from 'machinat-children';

const render = moxy(
  node =>
    map(node, element =>
      typeof element === 'string' || typeof element === 'number'
        ? { element, value: element }
        : {
            element,
            value: element.type(element.props, render)[0],
          }
    ) || null
);

export default render;
