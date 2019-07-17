import { valuesOfAssertedType } from 'machinat-utility';

import { asPartComponent } from '../utils';
import { GenericTemplate } from './template';

const URLButton = async ({
  props: { title, url, heightRatio, extensions, fallbackURL, hideShareButton },
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

const PostbackButton = async ({ props: { title, payload } }) => ({
  type: 'postback',
  title,
  payload,
});
const __PostbackButton = asPartComponent(PostbackButton);

const getGenericTemplateValues = valuesOfAssertedType(GenericTemplate);

const ShareButton = async ({ props: { children } }, render) => {
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
  props: {
    title,
    payload,
    currency,
    paymentType,
    isTest,
    merchantName,
    requestedInfo,
    priceList,
  },
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

const CallButton = async ({ props: { title, number } }) => ({
  type: 'phone_number',
  title,
  number,
});
const __CallButton = asPartComponent(CallButton);

const LoginButton = async ({ props: { url } }) => ({
  type: 'account_link',
  url,
});
const __LoginButton = asPartComponent(LoginButton);

const ACCOUNT_UNLINK_TYPE = { type: 'account_unlink' };
const LogoutButton = async () => ACCOUNT_UNLINK_TYPE;
const __LogoutButton = asPartComponent(LogoutButton);

const GamePlayButton = async ({
  props: { title, payload, playerId, contextId },
}) => ({
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
