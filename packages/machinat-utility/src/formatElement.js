// @flow
import type { MachinatRenderable } from 'machinat/types';

const formatProps = props => {
  const keys = Object.keys(props);
  let formated = '';

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = props[key];
    formated += `${key}=${
      typeof value === 'string' ? `"${value}"` : `{${String(value)}}`
    } `;
  }

  return formated;
};

const formatElement = (
  element: ?MachinatRenderable,
  withProps: boolean = false
): string =>
  !element || typeof element === 'number'
    ? String(element)
    : typeof element === 'string'
    ? `"${element}"`
    : typeof element.type === 'string'
    ? `<${element.type} ${withProps ? formatProps(element.props) : ''}/>`
    : typeof element.type === 'symbol'
    ? `<${element.type.toString()} ${
        withProps ? formatProps(element.props) : ''
      }/>`
    : typeof element.type === 'function' && element.type.name
    ? `<${element.type.name} ${withProps ? formatProps(element.props) : ''}/>`
    : `element with type (${String(element.type)})${
        withProps
          ? ` and props (${formatProps(element.props).slice(0, -1)})`
          : ''
      }`;

export default formatElement;
