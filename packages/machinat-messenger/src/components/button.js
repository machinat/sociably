import { partSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';

export const URLButton = (node, path) => {
  const {
    title,
    url,
    fallbackURL,
    messengerExtensions,
    webviewHeightRatio,
    webviewShareButton,

    hideWebviewShare,
  } = node.props;

  return [
    partSegment(node, path, {
      type: 'web_url',
      title,
      url,
      webview_height_ratio: webviewHeightRatio,
      messenger_extensions: messengerExtensions,
      fallback_url: fallbackURL,
      webview_share_button:
        webviewShareButton || hideWebviewShare ? 'hide' : undefined,
    }),
  ];
};
annotateMessengerComponent(URLButton);

export const PostbackButton = (node, path) => {
  const { title, payload } = node.props;
  return [
    partSegment(node, path, {
      type: 'postback',
      title,
      payload,
    }),
  ];
};
annotateMessengerComponent(PostbackButton);

export const BuyButton = (node, path) => {
  const {
    title,
    payload,
    currency,
    paymentType,
    isTest,
    merchantName,
    requestedInfo,
    priceList,
  } = node.props;

  return [
    partSegment(node, path, {
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
    }),
  ];
};
annotateMessengerComponent(BuyButton);

export const CallButton = (node, path) => {
  const { title, number } = node.props;
  return [
    partSegment(node, path, {
      type: 'phone_number',
      title,
      number,
    }),
  ];
};
annotateMessengerComponent(CallButton);

export const LoginButton = (node, path) => {
  const { url } = node.props;
  return [
    partSegment(node, path, {
      type: 'account_link',
      url,
    }),
  ];
};
annotateMessengerComponent(LoginButton);

export const LogoutButton = (node, path) => [
  partSegment(node, path, { type: 'account_unlink' }),
];
annotateMessengerComponent(LogoutButton);

export const GamePlayButton = (node, path) => {
  const { title, payload, playerId, contextId } = node.props;
  return [
    partSegment(node, path, {
      type: 'game_play',
      title,
      payload,
      game_metadata:
        playerId || contextId
          ? {
              player_id: playerId,
              context_id: contextId,
            }
          : undefined,
    }),
  ];
};
annotateMessengerComponent(GamePlayButton);
