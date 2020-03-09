import valuesOfAssertedTypes from '@machinat/core/utils/valuesOfAssertedTypes';

import { asPartComponent } from '../utils';
import { GenericTemplate } from './template';

const URLButton = async ({
  title,
  url,
  heightRatio,
  extensions,
  fallbackURL,
  hideShareButton,
}) => ({
  type: 'web_url',
  title,
  url,
  webview_height_ratio: heightRatio,
  messenger_extensions: extensions,
  fallback_url: fallbackURL,
  webview_share_button: hideShareButton ? 'hide' : undefined,
});
const __URLButton = asPartComponent(URLButton);

const PostbackButton = async ({ title, payload }) => ({
  type: 'postback',
  title,
  payload,
});
const __PostbackButton = asPartComponent(PostbackButton);

const getGenericTemplateValues = valuesOfAssertedTypes(() => [GenericTemplate]);

const ShareButton = async ({ children }, render) => {
  const sharedSegments = await render(children, '.children');

  let sharedContent;
  if (sharedSegments !== null) {
    sharedContent = getGenericTemplateValues(sharedSegments)[0].message;
  }

  return {
    type: 'element_share',
    share_contents: sharedContent,
  };
};
const __ShareButton = asPartComponent(ShareButton);

const BuyButton = async ({
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
const __BuyButton = asPartComponent(BuyButton);

const CallButton = async ({ title, number }) => ({
  type: 'phone_number',
  title,
  number,
});
const __CallButton = asPartComponent(CallButton);

const LoginButton = async ({ url }) => ({
  type: 'account_link',
  url,
});
const __LoginButton = asPartComponent(LoginButton);

const ACCOUNT_UNLINK_TYPE = { type: 'account_unlink' };
const LogoutButton = async () => ACCOUNT_UNLINK_TYPE;
const __LogoutButton = asPartComponent(LogoutButton);

const GamePlayButton = async ({ title, payload, playerId, contextId }) => ({
  type: 'game_play',
  title,
  payload,
  game_metadata: {
    player_id: playerId,
    context_id: contextId,
  },
});
const __GamePlayButton = asPartComponent(GamePlayButton);

export {
  __URLButton as URLButton,
  __PostbackButton as PostbackButton,
  __ShareButton as ShareButton,
  __BuyButton as BuyButton,
  __CallButton as CallButton,
  __LoginButton as LoginButton,
  __LogoutButton as LogoutButton,
  __GamePlayButton as GamePlayButton,
};
