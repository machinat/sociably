/* eslint-disable import/prefer-default-export */
import { annotateNative } from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';

export const QuickReply = ({ imageUrl, action }, render) => {
  const renderedAction = render(action, '.action');

  if (__DEV__) {
    // TODO: validate renderedAction
  }

  return {
    type: 'action',
    imageUrl,
    action: renderedAction[0].value,
  };
};

annotateNative(QuickReply, LINE_NAITVE_TYPE);
