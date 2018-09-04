import { annotateNative, renderOnlyType } from './utils';
import { GenericTemplate } from './template';

export const URLButton = ({
  title,
  url,
  heightRatio,
  extensions,
  fallbackUrl,
  hideShareButton,
}) => ({
  type: 'web_url',
  title,
  url,
  webview_height_ratio: heightRatio,
  messenger_extensions: extensions,
  fallback_url: fallbackUrl,
  webview_share_button: hideShareButton ? 'hide' : undefined,
});
annotateNative(URLButton);

export const PostbackButton = ({ title, payload }) => ({
  type: 'postback',
  title,
  payload,
});
annotateNative(PostbackButton);

const ELEMENT_SHARE_TYPE = { type: 'element_share' };
export const ShareButton = ({ children }, render) => {
  const templateResult = renderOnlyType(
    GenericTemplate,
    children,
    render,
    '.children'
  );

  if (templateResult !== undefined) {
    return {
      type: 'element_share',
      share_contents: templateResult[0].rendered.message,
    };
  }
  return ELEMENT_SHARE_TYPE;
};
annotateNative(ShareButton);

export const BuyButton = ({
  title,
  payload,
  currency,
  paymentType,
  isTest,
  merchantName,
  requestedInfo,
  priceList,
}) => ({
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
});
annotateNative(BuyButton);

export const CallButton = ({ title, number }) => ({
  type: 'phone_number',
  title,
  number,
});
annotateNative(CallButton);

export const LoginButton = ({ url }) => ({
  type: 'account_link',
  url,
});
annotateNative(LoginButton);

const ACCOUNT_UNLINK_TYPE = { type: 'account_unlink' };
export const LogoutButton = () => ACCOUNT_UNLINK_TYPE;
annotateNative(LogoutButton);

export const GamePlayButton = ({ title, payload, playerId, contextId }) => ({
  type: 'game_play',
  title,
  payload,
  game_metadata: {
    player_id: playerId,
    context_id: contextId,
  },
});
annotateNative(GamePlayButton);
