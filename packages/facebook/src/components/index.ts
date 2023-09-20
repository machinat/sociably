import { NativeComponent } from '@sociably/core';
import * as Messenger from '@sociably/messenger/components';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import { FacebookIntermediateSegment } from '../types.js';

// media

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Image: NativeComponent<ImageProps, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.Image);
export type ImageProps = Messenger.MediaProps;

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Video: NativeComponent<VideoProps, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.Video);
export type VideoProps = Messenger.MediaProps;

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Audio: NativeComponent<AudioProps, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.Audio);
export type AudioProps = Messenger.MediaProps;

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const File: NativeComponent<FileProps, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.File);
export type FileProps = Messenger.MediaProps;

// buttons

/**
 * The URL Button opens a webpage in the Messenger webview. This button can be
 * used with the Button and Generic Templates.
 *
 * @category Component
 * @props {@link UrlButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/reference/buttons/url)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#url).
 */
export const UrlButton: NativeComponent<
  UrlButtonProps,
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.UrlButton);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.PostbackButton);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.CallButton);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.LoginButton);
export type LoginButtonProps = Messenger.LoginButtonProps;

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#game_play)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/game-play).
 */
export const LogoutButton: NativeComponent<{}, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.LogoutButton);

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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.GamePlayButton);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.TextReply);
export type TextReplyProps = Messenger.TextReplyProps;

/**
 * Add an e-amil quick reply button after an {@link Expression}
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const EmailReply: NativeComponent<{}, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.EmailReply);

/**
 * Add an phone quick reply button after an {@link Expression}
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const PhoneReply: NativeComponent<{}, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.PhoneReply);

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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.PassThreadControl);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.RequestThreadControl);

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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.TakeThreadContorl);
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
export const MarkSeen: NativeComponent<{}, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.MarkSeen);

/**
 * Display the typing bubble.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOn: NativeComponent<{}, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.TypingOn);

/**
 * Remove the typing bubble.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOff: NativeComponent<{}, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.TypingOff);

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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.GenericItem);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.GenericTemplate);
export type GenericTemplateProps = Messenger.GenericTemplateProps;

/**
 * The button template allows you to send a structured message that includes
 * text and buttons.
 *
 * @category Component
 * @props {@link ButtonTemplateProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/button)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/button).
 */
export const ButtonTemplate: NativeComponent<
  ButtonTemplateProps,
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.ButtonTemplate);
export type ButtonTemplateProps = Messenger.ButtonTemplateProps;

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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.MediaTemplate);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.ReceiptItem);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.ReceiptTemplate);
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
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.RequestOneTimeNotif);
export type RequestOneTimeNotifProps = Messenger.RequestOneTimeNotifProps;

// text

/**
 * The receipt template allows you to send an order confirmation as a structured
 * message.
 *
 * @category Component
 * @props {@link LatexProps}
 * @guides Check [help page](https://www.facebook.com/help/147348452522644).
 */
export const Latex: NativeComponent<LatexProps, FacebookIntermediateSegment> =
  makeFacebookComponent(Messenger.Latex);
export type LatexProps = Messenger.LatexProps;

// expression

/**
 * Annotate all the children content with the message settings attributes and
 * append quick replies after the content.
 *
 * @category Component
 * @props {@link ExpressionProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Expression: NativeComponent<
  ExpressionProps,
  FacebookIntermediateSegment
> = makeFacebookComponent(Messenger.Expression);
export type ExpressionProps = Messenger.ExpressionProps;

// page
// comment
