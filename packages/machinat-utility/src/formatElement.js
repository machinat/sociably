// @flow

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

const formatElement = (element: any, withProps: boolean = false): string =>
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
    : typeof element.type === 'function'
    ? element.type.name
      ? `<${element.type.name} ${withProps ? formatProps(element.props) : ''}/>`
      : `<(${String(element.type)}) ${
          withProps ? formatProps(element.props) : ''
        }/>`
    : JSON.stringify(element);

export default formatElement;
