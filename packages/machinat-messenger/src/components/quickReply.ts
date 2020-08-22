import { partSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';

export const QuickReply = (node, path) => {
  const { title, payload, imageURL } = node.props;
  return [
    partSegment(node, path, {
      content_type: 'text',
      title,
      payload,
      image_url: imageURL,
    }),
  ];
};
annotateMessengerComponent(QuickReply);

const PHONE_QUICK_REPLY_VALUES = { content_type: 'user_phone_number' };

export const PhoneQuickReply = (node, path) => [
  partSegment(node, path, PHONE_QUICK_REPLY_VALUES),
];
annotateMessengerComponent(PhoneQuickReply);

const EMAIL_QUICK_REPLY_VALUES = { content_type: 'user_email' };

export const EmailQuickReply = (node, path) => [
  partSegment(node, path, EMAIL_QUICK_REPLY_VALUES),
];
annotateMessengerComponent(EmailQuickReply);
