import type {
  TextEventProto,
  TextEchoEventProto,
  ImageEventProto,
  ImageEchoEventProto,
  VideoEventProto,
  VideoEchoEventProto,
  AudioEventProto,
  AudioEchoEventProto,
  FileEventProto,
  FileEchoEventProto,
  LocationEventProto,
  ProductTemplateEventProto,
  TemplateEchoEventProto,
  FallbackEventProto,
  FallbackEchoEventProto,
  ReactionEventProto,
  QuickReplyEventProto,
  PostbackEventProto,
  ReferralEventProto,
  ReadEventProto,
  DeliveryEventProto,
  AccountLinkingEventProto,
  GamePlayEventProto,
  PassThreadControlEventProto,
  TakeThreadControlEventProto,
  RequestThreadControlEventProto,
  AppRolesEventProto,
  OptinEventProto,
  OneTimeNotifOptinEventProto,
  PolicyEnforcementEventProto,
  UnknownEventProto,
} from '@sociably/messenger';
import type FacebookChat from '../Chat.js';
import type FacebookUser from '../User.js';
import type FacebookPage from '../Page.js';
import { FACEBOOK } from '../constant.js';
import type { FacebookThread, FacebookRawEvent } from '../types.js';

interface EventObject<
  Category extends string,
  Type extends string,
  Thread extends null | FacebookThread = FacebookChat,
  User extends null | FacebookUser = FacebookUser,
> {
  platform: typeof FACEBOOK;
  category: Category;
  type: Type;
  thread: Thread;
  user: User;
  channel: FacebookPage;
  payload: FacebookRawEvent;
}

/**
 * This callback will occur when a text message has been sent to your Page.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface TextEvent
  extends EventObject<'message' | 'standby', 'text'>,
    TextEventProto {}

/**
 * TextEchoEvent will occur when a text message has been sent by your page.
 *
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
export interface TextEchoEvent
  extends EventObject<'echo', 'text'>,
    TextEchoEventProto {}

/**
 * This callback will occur when an image message has been sent to your Page.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface ImageEvent
  extends EventObject<'message' | 'standby', 'image'>,
    ImageEventProto {}

/**
 * ImageEchoEvent will occur when a image message has been sent by your page.
 *
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
export interface ImageEchoEvent
  extends EventObject<'echo', 'image'>,
    ImageEchoEventProto {}

/**
 * This callback will occur when a video message has been sent to your Page.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface VideoEvent
  extends EventObject<'message' | 'standby', 'video'>,
    VideoEventProto {}

/**
 * VideoEchoEvent will occur when a video message has been sent by your page.
 *
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
export interface VideoEchoEvent
  extends EventObject<'echo', 'video'>,
    VideoEchoEventProto {}

/**
 * This callback will occur when an audio message has been sent to your Page.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface AudioEvent
  extends EventObject<'message' | 'standby', 'audio'>,
    AudioEventProto {}

/**
 * AudioEchoEvent will occur when a text message has been sent by your page.
 *
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
export interface AudioEchoEvent
  extends EventObject<'echo', 'audio'>,
    AudioEchoEventProto {}

/**
 * This callback will occur when a file message has been sent to your Page.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface FileEvent
  extends EventObject<'message' | 'standby', 'file'>,
    FileEventProto {}

/**
 * FileEchoEvent will occur when a text message has been sent by your page.
 *
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
export interface FileEchoEvent
  extends EventObject<'echo', 'file'>,
    FileEchoEventProto {}

/**
 * This callback will occur when a location message has been sent to your Page.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface LocationEvent
  extends EventObject<'message' | 'standby', 'location'>,
    LocationEventProto {}

/**
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface ProductTemplateEvent
  extends EventObject<'message' | 'standby', 'product_template'>,
    ProductTemplateEventProto {}

/**
 * TemplateEchoEvent will occur when a template message has been sent by your
 * page.
 *
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
export interface TemplateEchoEvent
  extends EventObject<'echo', 'template'>,
    TemplateEchoEventProto {}

/**
 * FallbackMessageEvent will occur when an unsupported message shared by user
 * has been sent to your Page.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface FallbackEvent
  extends EventObject<'message' | 'standby', 'fallback'>,
    FallbackEventProto {}

/**
 * FallbackEchoEvent will occur when a message not supporeted by echo feature
 * has been sent by your page.
 *
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
export interface FallbackEchoEvent
  extends EventObject<'echo', 'fallback'>,
    FallbackEchoEventProto {}

/**
 * ReactionEvent will be sent to your webhook when a user reacts to a message.
 *
 * @category Event
 * @subscription `message_reactions`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-reactions).
 */
export interface ReactionEvent
  extends EventObject<'action', 'reaction'>,
    ReactionEventProto {}

/**
 * QuickReplyEvent occur when a {@link QuickReply} button is tapped.
 *
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
export interface QuickReplyEvent
  extends EventObject<'callback' | 'standby', 'quick_reply'>,
    QuickReplyEventProto {}

/**
 * PostbackEvent occur when a [postback
 * button](https://developers.facebook.com/docs/messenger-platform/send-api-reference/postback-button),
 * [Get Started
 * button](https://developers.facebook.com/docs/messenger-platform/messenger-profile/get-started-button),
 * or [persistent menu
 * item](https://developers.facebook.com/docs/messenger-platform/messenger-profile/persistent-menu)
 * is tapped. Note that if the event is standby it will not include the postback
 * data. Only the app that originally sent the postback button will receive the
 * normal webhook event that includes the postback data.
 *
 * @category Event
 * @subscription `messaging_postbacks`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_postbacks).
 */
export interface PostbackEvent
  extends EventObject<
      'callback' | 'standby',
      'postback',
      FacebookChat<'user' | 'user_ref'>,
      FacebookUser | null
    >,
    PostbackEventProto {}

/**
 * This callback will occur when the user already has a thread with the bot and
 * user comes to the thread from:
 *
 * - Following an m.me link with a referral parameter
 * - Clicking on a Messenger Conversation Ad
 * - Starting or resuming a conversation from the customer chat plugin.
 *
 * For tracking referrals in new threads, refer to {@link PostbackEvent}.
 *
 * @category Event
 * @subscription `messaging_referrals`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_referrals).
 */
export interface ReferralEvent
  extends EventObject<
      'action',
      'referral',
      FacebookChat<'user' | 'user_ref'>,
      null | FacebookUser
    >,
    ReferralEventProto {}

/**
 * ReadEvent will be sent to your webhook when a message a Page has sent has
 * been read by the user.
 *
 * @category Event
 * @subscription `message_reads`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-reads).
 */
export interface ReadEvent
  extends EventObject<'action' | 'standby', 'read'>,
    ReadEventProto {}

/**
 * DeliveryEvent will occur when a message a Page has sent has been delivered.
 *
 * @category Event
 * @subscription `message_deliveries`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-deliveries).
 */
export interface DeliveryEvent
  extends EventObject<'system' | 'standby', 'delivery'>,
    DeliveryEventProto {}

/**
 * AccountLinkingEvent will occur when the Link Account or Unlink Account button
 * have been tapped when using Account Linking.
 *
 * @category Event
 * @subscription `messaging_account_linking`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/account-linking)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_account_linking).
 */
export interface AccountLinkingEvent
  extends EventObject<'action', 'account_linking'>,
    AccountLinkingEventProto {}

/**
 * GamePlayEvent occurs after a person played a round of Instant Games.
 *
 * @category Event
 * @subscription `messaging_game_plays`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_game_plays).
 */
export interface GamePlayEvent
  extends EventObject<'action', 'game_play'>,
    GamePlayEventProto {}

/**
 * PassThreadControlEvent occurs when the thread ownership for a user has been
 * passed to your application.
 *
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/pass-thread-control)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#pass_thread_control).
 */
export interface PassThreadControlEvent
  extends EventObject<'handover_protocol', 'pass_thread_control'>,
    PassThreadControlEventProto {}

/**
 * TakeThreadControlEvent occurs when the thread ownership for a user has been
 * taken away from your application.
 *
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/take-thread-control)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#take_thread_control).
 */
export interface TakeThreadControlEvent
  extends EventObject<'handover_protocol', 'take_thread_control'>,
    TakeThreadControlEventProto {}

/**
 * RequestThreadControlEvent is sent to the Primary Receiver app when a
 * Secondary Receiver app calls the Request Thread Control API. The Primary
 * Receiver may then choose to honor the request and pass thread control, or
 * ignore the request.
 *
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/request-thread-control)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#request_thread_control).
 */
export interface RequestThreadControlEvent
  extends EventObject<'handover_protocol', 'request_thread_control'>,
    RequestThreadControlEventProto {}

/**
 * AppRolesEvent occurs when a page admin changes the role of your application.
 * An app can be assigned the roles of _primary_receiver_ or
 * _secondary_receiver_.
 *
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/assign-app-roles)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#app_roles).
 */
export interface AppRolesEvent
  extends EventObject<'handover_protocol', 'app_roles'>,
    AppRolesEventProto {}

/**
 * OptinEvent occurs when the [send to
 * Messenger](https://developers.facebook.com/docs/messenger-platform/discovery/send-to-messenger-plugin)
 * plugin has been tapped, a user has accepted a message request using [customer
 * matching](https://developers.facebook.com/docs/messenger-platform/guides/customer-matching),
 * or a user has opted in to receive messages via the [checkbox
 * plugin](https://developers.facebook.com/docs/messenger-platform/discovery/checkbox-plugin).
 *
 * @category Event
 * @subscription `messaging_optins`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_optins).
 */
export interface OptinEvent
  extends EventObject<
      'callback',
      'optin',
      FacebookChat<'user' | 'user_ref'>,
      null | FacebookUser
    >,
    OptinEventProto {}

/**
 * OneTimeNotifOptinEvent occurs when the user consents to be notified on a
 * specific update.
 *
 * @category Event
 * @subscription `messaging_optins`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/one-time-notification).
 */
export interface OneTimeNotifOptinEvent
  extends EventObject<'callback', 'one_time_notif_optin'>,
    OneTimeNotifOptinEventProto {}

/**
 * PolicyEnforcementEvent will be sent to an app if the page it manages does not
 * conform to Messenger Platform policy.
 *
 * @category Event
 * @subscription `messaging_policy_enforcement`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_policy_enforcement).
 */
export interface PolicyEnforcementEvent
  extends EventObject<'system', 'policy_enforcement', null, null>,
    PolicyEnforcementEventProto {}

/** @category Event */
export interface UnknownEvent
  extends EventObject<'unknown', 'unknown'>,
    UnknownEventProto {}

/** @category Event */
export type FacebookEvent =
  | TextEvent
  | TextEchoEvent
  | ImageEvent
  | ImageEchoEvent
  | VideoEvent
  | VideoEchoEvent
  | AudioEvent
  | AudioEchoEvent
  | FileEvent
  | FileEchoEvent
  | LocationEvent
  | ProductTemplateEvent
  | TemplateEchoEvent
  | FallbackEvent
  | FallbackEchoEvent
  | ReactionEvent
  | QuickReplyEvent
  | PostbackEvent
  | ReferralEvent
  | ReadEvent
  | DeliveryEvent
  | AccountLinkingEvent
  | GamePlayEvent
  | PassThreadControlEvent
  | TakeThreadControlEvent
  | RequestThreadControlEvent
  | AppRolesEvent
  | OptinEvent
  | OneTimeNotifOptinEvent
  | PolicyEnforcementEvent
  | UnknownEvent;
