/* eslint-disable import/prefer-default-export */
import { getValue } from 'machinat-renderer';

export const renderQuickReplies = (nodes, render) => {
  const renderedReplies = render(nodes, '.quickReplies');

  if (__DEV__) {
    // TODO: validate renderedReplies
  }

  return renderedReplies && renderedReplies.map(getValue);
};
