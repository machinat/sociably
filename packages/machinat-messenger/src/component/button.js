import {
  annotate,
  asNative,
  asUnit,
  valuesOfAssertedType,
} from 'machinat-utility';
import { MESSENGER_NAITVE_TYPE } from '../symbol';
import { GenericTemplate } from './template';

export const URLButton = ({
  title,
  url,
  heightRatio,
  extensions,
  fallbackURL,
  hideShareButton,
}) => [
  {
    type: 'web_url',
    title,
    url,
    webview_height_ratio: heightRatio,
    messenger_extensions: extensions,
    fallback_url: fallbackURL,
    webview_share_button: hideShareButton ? 'hide' : undefined,
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(URLButton);

export const PostbackButton = ({ title, payload }) => [
  {
    type: 'postback',
    title,
    payload,
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(PostbackButton);

const renderGenericTemplateValues = valuesOfAssertedType(GenericTemplate);

export const ShareButton = ({ children }, render) => {
  const sharedValues = renderGenericTemplateValues(
    children,
    render,
    '.children'
  );

  return [
    {
      type: 'element_share',
      share_contents: sharedValues && sharedValues[0].message,
    },
  ];
};

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(ShareButton);

export const BuyButton = ({
  title,
  payload,
  currency,
  paymentType,
  isTest,
  merchantName,
  requestedInfo,
  priceList,
}) => [
  {
    type: 'payment',
    title,
    payload,
    payment_summary: {
      currency,
      payment_type: paymentType,
      is_test_payment: isTest,
      merchant_name: merchantName,
      requested_user_info: requestedInfo,
      price_list: priceList,
    },
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(BuyButton);

export const CallButton = ({ title, number }) => [
  {
    type: 'phone_number',
    title,
    number,
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(CallButton);

export const LoginButton = ({ url }) => [
  {
    type: 'account_link',
    url,
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(LoginButton);

const ACCOUNT_UNLINK_TYPE = { type: 'account_unlink' };
export const LogoutButton = () => [ACCOUNT_UNLINK_TYPE];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(LogoutButton);

export const GamePlayButton = ({ title, payload, playerId, contextId }) => [
  {
    type: 'game_play',
    title,
    payload,
    game_metadata: {
      player_id: playerId,
      context_id: contextId,
    },
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(GamePlayButton);
