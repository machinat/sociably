import { annotateNative } from './utils';

export const QuickReply = ({ title, payload, imageUrl }) => ({
  content_type: 'text',
  title,
  payload,
  image_url: imageUrl,
});
annotateNative(QuickReply);

const LOCATION_QUICK_REPLY = { content_type: 'location' };
export const LocationQuickReply = () => LOCATION_QUICK_REPLY;
annotateNative(LocationQuickReply);

const PHONE_QUICK_REPLY = { content_type: 'user_phone_number' };
export const PhoneQuickReply = () => PHONE_QUICK_REPLY;
annotateNative(PhoneQuickReply);

const EMAIL_QUICK_REPLY = { content_type: 'user_email' };
export const EmailQuickReply = () => EMAIL_QUICK_REPLY;
annotateNative(EmailQuickReply);
