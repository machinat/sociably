import {
  MACHINAT_PAUSE_TYPE,
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_INJECTION_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
} from '../symbol';

const formatProps = (props) => {
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

const formatNode = (element: any, withProps = false): string =>
  !element || typeof element === 'number'
    ? String(element)
    : typeof element === 'string'
    ? `"${element}"`
    : typeof element.type === 'string'
    ? `<${element.type} ${withProps ? formatProps(element.props) : ''}/>`
    : typeof element.type === 'symbol'
    ? element.type === MACHINAT_PAUSE_TYPE
      ? `<Pause ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === MACHINAT_FRAGMENT_TYPE
      ? `<Fragment ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === MACHINAT_INJECTION_TYPE
      ? `<Injection ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === MACHINAT_THUNK_TYPE
      ? `<Thunk ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === MACHINAT_RAW_TYPE
      ? `<Raw ${withProps ? formatProps(element.props) : ''}/>`
      : `<${element.type.toString()} ${
          withProps ? formatProps(element.props) : ''
        }/>`
    : typeof element.type === 'function'
    ? element.type.name
      ? `<${element.type.name} ${withProps ? formatProps(element.props) : ''}/>`
      : `<(${String(element.type)}) ${
          withProps ? formatProps(element.props) : ''
        }/>`
    : typeof element.type === 'object'
    ? Object.prototype.toString.call(element)
    : String(element);

export default formatNode;
