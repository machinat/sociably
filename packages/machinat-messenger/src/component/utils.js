import invariant from 'invariant';
import { MESSENGER_NAITVE_TYPE } from '../symbol';

export const annotateNative = component =>
  Object.assign(component, { $$native: MESSENGER_NAITVE_TYPE });

export const annotateNativeRoot = (component, entry) =>
  Object.assign(component, {
    $$entry: entry,
    $$native: MESSENGER_NAITVE_TYPE,
    $$root: true,
  });

const textReducer = (text, cur) => {
  invariant(
    typeof cur.rendered === 'string',
    `expect element at ${cur.path} can be rendered as string, got ${
      cur.element
    }`
  );
  return text + cur.rendered;
};

export const renderTextContent = (node, render, propName) => {
  const rendered = render(node, `.${propName}`);
  if (rendered === undefined) {
    return undefined;
  }

  return rendered.reduce(textReducer, '');
};

export const getRendered = result => result.rendered;
export const getElement = result => result.element;

const onlyType = (Type, result) => {
  for (let i = 0; i < result.length; i += 1) {
    if (Type !== result[i].element.type) return false;
  }
  return true;
};
export const renderOnlyType = (Type, node, render, propName) => {
  const result = render(node, `.${propName}`);
  if (result === undefined) {
    return undefined;
  }

  invariant(
    onlyType(Type, result),
    `${propName} prop should contain only ${
      Type.name
    } elements, got ${result.map(getElement)}`
  );
  return result;
};

const onlyInTypes = (types, result) => {
  for (let i = 0; i < result.length; i += 1) {
    if (types.indexOf(result[i].element.type) === -1) return false;
  }
  return true;
};
export const renderOnlyInTypes = (types, node, render, propName) => {
  const result = render(node, `.${propName}`);
  if (result === undefined) {
    return undefined;
  }

  invariant(
    onlyInTypes(types, result),
    `${propName} prop should contain only ${types
      .map(Type => Type.name)
      .join(', ')} elements, got ${result.map(getElement)}`
  );
  return result;
};
