import invariant from 'invariant';

export const annotateNative = (Component, nativeType) =>
  Object.assign(Component, { $$native: nativeType });

export const annotateNativeRoot = (Component, nativeType, entry) =>
  Object.assign(Component, {
    $$entry: entry,
    $$native: nativeType,
    $$root: true,
  });

const textReducer = (text, cur) => text + cur.value;

export const renderTextContent = (node, render, propPath) => {
  const rendered = render(node, propPath);
  if (rendered === undefined) {
    return undefined;
  }

  if (__DEV__) {
    const illegal = rendered.find(
      r => typeof r.value !== 'string' && typeof r.value !== 'number'
    );

    invariant(
      illegal === undefined,
      `${illegal && illegal.element} at ${illegal &&
        illegal.path} is not rendered as legal text content`
    );
  }

  return rendered.reduce(textReducer, '');
};

export const getValue = result => result.value;
export const getElement = result => result.element;
