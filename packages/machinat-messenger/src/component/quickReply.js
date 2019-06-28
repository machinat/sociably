import { asSinglePartComponent } from './utils';

const QuickReply = ({ props: { title, payload, imageURL } }) => ({
  content_type: 'text',
  title,
  payload,
  image_url: imageURL,
});
const __QuickReply = asSinglePartComponent(QuickReply);

const LOCATION_QUICK_REPLY_VALUES = { content_type: 'location' };
const LocationQuickReply = async () => LOCATION_QUICK_REPLY_VALUES;
const __LocationQuickReply = asSinglePartComponent(LocationQuickReply);

const PHONE_QUICK_REPLY_VALUES = { content_type: 'user_phone_number' };
const PhoneQuickReply = async () => PHONE_QUICK_REPLY_VALUES;
const __PhoneQuickReply = asSinglePartComponent(PhoneQuickReply);

const EMAIL_QUICK_REPLY_VALUES = { content_type: 'user_email' };
const EmailQuickReply = async () => EMAIL_QUICK_REPLY_VALUES;
const __EmailQuickReply = asSinglePartComponent(EmailQuickReply);

export {
  __QuickReply as QuickReply,
  __LocationQuickReply as LocationQuickReply,
  __PhoneQuickReply as PhoneQuickReply,
  __EmailQuickReply as EmailQuickReply,
};
