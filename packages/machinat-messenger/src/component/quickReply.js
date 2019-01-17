import { annotate, asNative, asUnit } from 'machinat-utility';

import { MESSENGER_NAITVE_TYPE } from '../symbol';

export const QuickReply = ({ title, payload, imageURL }) => [
  {
    content_type: 'text',
    title,
    payload,
    image_url: imageURL,
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(QuickReply);

const LOCATION_QUICK_REPLY_RENDERED = [{ content_type: 'location' }];
const PHONE_QUICK_REPLY_RENDERED = [{ content_type: 'user_phone_number' }];
const EMAIL_QUICK_REPLY_RENDERED = [{ content_type: 'user_email' }];

export const LocationQuickReply = () => LOCATION_QUICK_REPLY_RENDERED;

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(LocationQuickReply);

export const PhoneQuickReply = () => PHONE_QUICK_REPLY_RENDERED;

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(PhoneQuickReply);

export const EmailQuickReply = () => EMAIL_QUICK_REPLY_RENDERED;

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(EmailQuickReply);
