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

export const renderQuickReplies = (nodes, render) => {
  const renderedReplies = render(nodes, '.quickReplies');

  if (__DEV__) {
    // TODO: validate renderedReplies
  }

  return renderedReplies && renderedReplies.map(getValue);
};
