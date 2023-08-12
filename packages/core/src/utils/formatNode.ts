import {
  SOCIABLY_PAUSE_TYPE,
  SOCIABLY_FRAGMENT_TYPE,
  SOCIABLY_PROVIDER_TYPE,
  SOCIABLY_THUNK_TYPE,
  SOCIABLY_RAW_TYPE,
} from '../symbol.js';

const formatProps = (props: Record<string, unknown>) => {
  let formated = '';

  for (const [key, value] of Object.entries(props)) {
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
    ? element.type === SOCIABLY_PAUSE_TYPE
      ? `<Pause ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === SOCIABLY_FRAGMENT_TYPE
      ? `<Fragment ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === SOCIABLY_PROVIDER_TYPE
      ? `<Provider ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === SOCIABLY_THUNK_TYPE
      ? `<Thunk ${withProps ? formatProps(element.props) : ''}/>`
      : element.type === SOCIABLY_RAW_TYPE
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
