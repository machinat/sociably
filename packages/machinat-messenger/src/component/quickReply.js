import { annotateNative } from 'machinat-renderer';

import { MESSENGER_NAITVE_TYPE } from '../symbol';

export const QuickReply = ({ title, payload, imageUrl }) => ({
  content_type: 'text',
  title,
  payload,
  image_url: imageUrl,
});
annotateNative(QuickReply, MESSENGER_NAITVE_TYPE);

const LOCATION_QUICK_REPLY = { content_type: 'location' };
export const LocationQuickReply = () => LOCATION_QUICK_REPLY;
annotateNative(LocationQuickReply, MESSENGER_NAITVE_TYPE);

const PHONE_QUICK_REPLY = { content_type: 'user_phone_number' };
export const PhoneQuickReply = () => PHONE_QUICK_REPLY;
annotateNative(PhoneQuickReply, MESSENGER_NAITVE_TYPE);

const EMAIL_QUICK_REPLY = { content_type: 'user_email' };
export const EmailQuickReply = () => EMAIL_QUICK_REPLY;
annotateNative(EmailQuickReply, MESSENGER_NAITVE_TYPE);
