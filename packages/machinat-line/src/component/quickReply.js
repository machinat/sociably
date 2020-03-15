/* eslint-disable import/prefer-default-export */
import { partSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const QuickReply = async (node, path, render) => {
  const { imageURL, action } = node.props;

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      type: 'action',
      imageUrl: imageURL,
      action: actionValue,
    }),
  ];
};

annotateLineComponent(QuickReply);
