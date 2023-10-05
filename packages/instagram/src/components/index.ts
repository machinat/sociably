import { NativeComponent } from '@sociably/core';
import { MessengerIntermediateSegment } from '@sociably/messenger';
import * as Messenger from '@sociably/messenger/components';
import makeInstagramComponent from '../utils/makeInstagramComponent.js';

// expression

export * from './Expression.js';

// media

export * from './Image.js';

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Audio: NativeComponent<
  Messenger.MediaProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.Audio);
export type AudioProps = Messenger.MediaProps;

// buttons

/**
 * The URL Button opens a web page in the Messenger webview. This button can be
 * used with the Button and Generic Templates.
 *
 * @category Component
 * @props {@link UrlButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/reference/buttons/url)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#url).
 */
export const UrlButton: NativeComponent<
  UrlButtonProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.UrlButton);
export type UrlButtonProps = Messenger.UrlButtonProps;

/**
 * When the postback button is tapped, the Messenger Platform sends an event to
 * your postback webhook. This is useful when you want to invoke an action in
 * your bot. This button can be used with the Button Template and Generic
 * Template.
 *
 * @category Component
 * @props {@link PostbackButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#postback)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/postback).
 */
export const PostbackButton: NativeComponent<
  PostbackButtonProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.PostbackButton);
export type PostbackButtonProps = Messenger.PostbackButtonProps;

/**
 * The Call Button can be used to initiate a phone call. This button can be used
 * with the Button and Generic Templates.
 *
 * @category Component
 * @props {@link CallButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#call)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/call).
 */
export const CallButton: NativeComponent<
  CallButtonProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.CallButton);
export type CallButtonProps = Messenger.CallButtonProps;

/**
 * The log in button triggers the [account linking authentication
 * flow](https://developers.facebook.com/docs/messenger-platform/account-linking/authentication).
 *
 * @category Component
 * @props {@link LoginButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#login)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/login).
 */
export const LoginButton: NativeComponent<
  LoginButtonProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.LoginButton);
export type LoginButtonProps = Messenger.LoginButtonProps;

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#game_play)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/game-play).
 */
export const LogoutButton: NativeComponent<{}, MessengerIntermediateSegment> =
  makeInstagramComponent(Messenger.LogoutButton);

/**
 * The game play button launches an Instant Game that is associated with the bot
 * page.
 *
 * @category Component
 * @props {@link GamePlayButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#game_play)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/game-play).
 */
export const GamePlayButton: NativeComponent<
  GamePlayButtonProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.GamePlayButton);
export type GamePlayButtonProps = Messenger.GamePlayButtonProps;

// quick replies

/**
 * Add an text quick reply button with postback payload after an
 * {@link Expression}.
 *
 * @category Component
 * @props {@link TextReplyProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const TextReply: NativeComponent<
  TextReplyProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.TextReply);
export type TextReplyProps = Messenger.TextReplyProps;

/**
 * Add an e-amil quick reply button after an {@link Expression}
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const EmailReply: NativeComponent<{}, MessengerIntermediateSegment> =
  makeInstagramComponent(Messenger.EmailReply);

/**
 * Add an phone quick reply button after an {@link Expression}
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const PhoneReply: NativeComponent<{}, MessengerIntermediateSegment> =
  makeInstagramComponent(Messenger.PhoneReply);

// handover protocols

/**
 * Pass thread control from your app to another app. The app that will receive
 * thread ownership will receive a pass_thread_control webhook event.
 *
 * @category Component
 * @props {@link PassThreadControlProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/handover-protocol/pass-thread-control).
 */
export const PassThreadControl: NativeComponent<
  PassThreadControlProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.PassThreadControl);
export type PassThreadControlProps = Messenger.PassThreadControlProps;

/**
 * Ask for control of a specific thread as a Secondary Receiver app. The Primary
 * Receiver app will receive a messaging_handovers webhook event with the
 * request_thread_control property when/request_thread_control` is called.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/handover-protocol/request-thread-control).
 */
export const RequestThreadControl: NativeComponent<
  {},
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.RequestThreadControl);

/**
 * Take control of a specific thread from a Secondary Receiver app as the
 * Primary Receiver app. The Secondary Receiver app will receive a
 * take_thread_control webhook event when it loses thread control.
 *
 * @category Component
 * @props {@link TakeThreadContorlProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/handover-protocol/take-thread-control).
 */
export const TakeThreadContorl: NativeComponent<
  TakeThreadContorlProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.TakeThreadContorl);
export type TakeThreadContorlProps = Messenger.TakeThreadContorlProps;

// sender actions

/**
 * Display the confirmation icon.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const MarkSeen: NativeComponent<{}, MessengerIntermediateSegment> =
  makeInstagramComponent(Messenger.MarkSeen);

/**
 * Display the typing bubble.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOn: NativeComponent<{}, MessengerIntermediateSegment> =
  makeInstagramComponent(Messenger.TypingOn);

/**
 * Remove the typing bubble.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOff: NativeComponent<{}, MessengerIntermediateSegment> =
  makeInstagramComponent(Messenger.TypingOff);

// templates

/**
 * The item of the {@link GenericTemplate}.
 *
 * @category Component
 * @props {@link GenericItemProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/generic).
 */
export const GenericItem: NativeComponent<
  GenericItemProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.GenericItem);
export type GenericItemProps = Messenger.GenericItemProps;

/**
 * The generic template allows you to send a structured message that includes an
 * image, text and buttons. A generic template with multiple templates described
 * in the elements array will send a horizontally scrollable carousel of items,
 * each composed of an image, text and buttons.
 *
 * @category Component
 * @props {@link GenericTemplateProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/generic).
 */
export const GenericTemplate: NativeComponent<
  GenericTemplateProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.GenericTemplate);
export type GenericTemplateProps = Messenger.GenericTemplateProps;

/**
 * The media template allows you to send a structured message that includes an
 * image or video, and an optional button.
 *
 * @category Component
 * @props {@link MediaTemplate}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/media)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/media).
 */
export const MediaTemplate: NativeComponent<
  MediaTemplateProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.MediaTemplate);
export type MediaTemplateProps = Messenger.MediaTemplateProps;

/**
 * The item of {@link ReceiptTemplate}
 *
 * @category Component
 * @props {@link ReceiptItemProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/receipt)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/receipt).
 */
export const ReceiptItem: NativeComponent<
  ReceiptItemProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.ReceiptItem);
export type ReceiptItemProps = Messenger.ReceiptItemProps;

/**
 * The receipt template allows you to send an order confirmation as a structured
 * message.
 *
 * @category Component
 * @props {@link ReceiptTemplateProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/receipt)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/receipt).
 */
export const ReceiptTemplate: NativeComponent<
  ReceiptTemplateProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.ReceiptTemplate);
export type ReceiptTemplateProps = Messenger.ReceiptTemplateProps;

/**
 * The Messenger Platform's One-Time Notification API (Beta) allows a page to
 * request a user to send one follow-up message after 24-hour messaging window
 * have ended. The user will be offered to receive a future notification. Once
 * the user asks to be notified, the page will receive a token which is an
 * equivalent to a permission to send a single message to the user. The token
 * can only be used once and will expire within 1 year of creation.
 *
 * @category Component
 * @props {@link RequestOneTimeNotifProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/one-time-notification).
 */
export const RequestOneTimeNotif: NativeComponent<
  RequestOneTimeNotifProps,
  MessengerIntermediateSegment
> = makeInstagramComponent(Messenger.RequestOneTimeNotif);
export type RequestOneTimeNotifProps = Messenger.RequestOneTimeNotifProps;

// posts

export * from './ImagePost.js';
export * from './ImageStory.js';
export * from './VideoPost.js';
export * from './VideoStory.js';
export * from './CarouselPost.js';
export * from './Reel.js';
