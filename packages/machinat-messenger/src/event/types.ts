import type {
  EventBase,
  Message,
  Text,
  QuickReplyPostback,
  NLP,
  Media,
  Sticker,
  Location,
  Fallback,
  Echo,
  Template,
  TemplateProduct,
  Reaction,
  Read,
  Delivery,
  AccountLinking,
  GamePlay,
  PassThreadControl,
  TakeThreadControl,
  RequestThreadControl,
  AppRoles,
  Optin,
  PolicyEnforcement,
  Postback,
  Referral,
} from './mixin';
import type { MessengerRawEvent } from '../types';

interface EventObject<
  Type extends string,
  Subtype extends undefined | string = undefined
> {
  type: Type;
  subtype: Subtype;
  payload: MessengerRawEvent;
}

/**
 * This callback will occur when a text message has been sent to your Page.
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface TextMessageEvent
  extends EventObject<'message', 'text'>,
    EventBase,
    Message,
    Text,
    Fallback,
    NLP {}

/**
 * TextEchoEvent will occur when a text message has been sent by your page.
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
interface TextEchoEvent
  extends EventObject<'echo', 'text'>,
    EventBase,
    Message,
    Text,
    Fallback,
    Echo {}

/**
 * This callback will occur when an image message has been sent to your Page.
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface ImageMessageEvent
  extends EventObject<'message', 'image'>,
    EventBase,
    Message,
    Media,
    Sticker {}

/**
 * ImageEchoEvent will occur when a image message has been sent by your page.
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
interface ImageEchoEvent
  extends EventObject<'echo', 'image'>,
    EventBase,
    Message,
    Media,
    Echo {}

/**
 * This callback will occur when a video message has been sent to your Page.
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface VideoMessageEvent
  extends EventObject<'message', 'video'>,
    EventBase,
    Message,
    Media {}

/**
 * VideoEchoEvent will occur when a video message has been sent by your page.
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
interface VideoEchoEvent
  extends EventObject<'echo', 'video'>,
    EventBase,
    Message,
    Media,
    Echo {}

/**
 * This callback will occur when an audio message has been sent to your Page.
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface AudioMessageEvent
  extends EventObject<'message', 'audio'>,
    EventBase,
    Message,
    Media {}

/**
 * AudioEchoEvent will occur when a text message has been sent by your page.
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
interface AudioEchoEvent
  extends EventObject<'echo', 'audio'>,
    EventBase,
    Message,
    Media,
    Echo {}

/**
 * This callback will occur when a file message has been sent to your Page.
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface FileMessageEvent
  extends EventObject<'message', 'file'>,
    EventBase,
    Message,
    Media {}

/**
 * FileEchoEvent will occur when a text message has been sent by your page.
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
interface FileEchoEvent
  extends EventObject<'echo', 'file'>,
    EventBase,
    Message,
    Media,
    Echo {}

/**
 * This callback will occur when a location message has been sent to your Page.
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface LocationMessageEvent
  extends EventObject<'message', 'location'>,
    EventBase,
    Message,
    Location {}

/**
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface ProductTemplateMessageEvent
  extends EventObject<'message', 'product_template'>,
    EventBase,
    Message,
    Template,
    TemplateProduct {}

/**
 * TemplateEchoEvent will occur when a template message has been sent by your
 * page.
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
interface TemplateEchoEvent
  extends EventObject<'echo', 'template'>,
    EventBase,
    Message,
    Template,
    Echo {}

/**
 * FallbackMessageEvent will occur when an unsupported message shared by user
 * has been sent to your Page.
 * @category Event
 * @subscription `messages`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface FallbackMessageEvent
  extends EventObject<'message', 'fallback'>,
    EventBase,
    Message,
    Fallback {}

/**
 * FallbackEchoEvent will occur when a message not supporeted by echo feature
 * has been sent by your page.
 * @category Event
 * @subscription `message_echoes`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-echoes).
 */
interface FallbackEchoEvent
  extends EventObject<'echo', 'fallback'>,
    EventBase,
    Message,
    Fallback,
    Echo {}

/**
 * ReactionEvent will be sent to your webhook when a user reacts to a message.
 * @category Event
 * @subscription `message_reactions`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-reactions).
 */
interface ReactionEvent extends EventObject<'reaction'>, EventBase, Reaction {}

/**
 * QuickReplyPostbackEvent occur when a {@link QuickReply} button is tapped.
 * @category Event
 * @subscription `messages`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages).
 */
interface QuickReplyPostbackEvent
  extends EventObject<'postback', 'quick_reply'>,
    EventBase,
    Message,
    Text,
    QuickReplyPostback {}

/**
 * ButtonPostbackEvent occur when a [postback button](https://developers.facebook.com/docs/messenger-platform/send-api-reference/postback-button),
 * [Get Started button](https://developers.facebook.com/docs/messenger-platform/messenger-profile/get-started-button),
 * or [persistent menu item](https://developers.facebook.com/docs/messenger-platform/messenger-profile/persistent-menu)
 * is tapped.
 * @category Event
 * @subscription `messaging_postbacks`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_postbacks).
 */
interface ButtonPostbackEvent
  extends EventObject<'postback', 'button'>,
    EventBase,
    Postback {}

/**
 * This callback will occur when the user already has a thread with the bot and
 * user comes to the thread from:
 *
 * - Following an m.me link with a referral parameter
 * - Clicking on a Messenger Conversation Ad
 * - Scanning a parametric Messenger Code.
 * - Starting a conversation from the Discover tab.
 * - Starting or resuming a conversation from the customer chat plugin.
 *
 * For tracking referrals in new threads, refer to {@link PostbackEvent}.
 * @category Event
 * @subscription `messaging_referrals`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_referrals).
 */
interface ReferralEvent extends EventObject<'referral'>, EventBase, Referral {}

/**
 * ReadEvent will be sent to your webhook when a message a Page has sent has
 * been read by the user.
 * @category Event
 * @subscription `message_reads`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-reads).
 */
interface ReadEvent extends EventObject<'read'>, EventBase, Read {}

/**
 * DeliveryEvent will occur when a message a Page has sent has been delivered.
 * @category Event
 * @subscription `message_deliveries`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-deliveries).
 */
interface DeliveryEvent extends EventObject<'delivery'>, EventBase, Delivery {}

/**
 * AccountLinkingEvent will occur when the Link Account or Unlink Account button
 * have been tapped when using Account Linking.
 * @category Event
 * @subscription `messaging_account_linking`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/account-linking)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_account_linking).
 */
interface AccountLinkingEvent
  extends EventObject<'account_linking'>,
    EventBase,
    AccountLinking {}

/**
 * GamePlayEvent occurs after a person played a round of Instant Games.
 * @category Event
 * @subscription `messaging_game_plays`
 * @guides Check official [doc]()
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_game_plays).
 */
interface GamePlayEvent extends EventObject<'game_play'>, EventBase, GamePlay {}

/**
 * PassThreadControlEvent will occur when thread ownership for a user has been
 * passed to your application.
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/pass-thread-control)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#pass_thread_control).
 */
interface PassThreadControlEvent
  extends EventObject<'pass_thread_control'>,
    EventBase,
    PassThreadControl {}

/**
 * TakeThreadControlEvent will occur when thread ownership for a user has been
 * taken away from your application.
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/take-thread-control)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#take_thread_control).
 */
interface TakeThreadControlEvent
  extends EventObject<'take_thread_control'>,
    EventBase,
    TakeThreadControl {}

/**
 * RequestThreadControlEvent will be sent to the Primary Receiver app when a
 * Secondary Receiver app calls the Request Thread Control API. The Primary
 * Receiver may then choose to honor the request and pass thread control, or
 * ignore the request.
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/request-thread-control)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#request_thread_control).
 */
interface RequestThreadControlEvent
  extends EventObject<'request_thread_control'>,
    EventBase,
    RequestThreadControl {}

/**
 * AppRolesEvent will occur when a page admin changes the role of your
 * application. An app can be assigned the roles of _primary_receiver_ or
 * _secondary_receiver_.
 * @category Event
 * @subscription `messaging_handovers`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol/assign-app-roles)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_handovers#app_roles).
 */
interface AppRolesEvent extends EventObject<'app_roles'>, EventBase, AppRoles {}

/**
 * OptinEvent will occur when the [send to Messenger](https://developers.facebook.com/docs/messenger-platform/plugin-reference/send-to-messenger)
 * plugin has been tapped, a user has accepted a message request using
 * [customer matching](https://developers.facebook.com/docs/messenger-platform/guides/customer-matching),
 * or a user has opted in to receive messages via the [checkbox plugin](https://developers.facebook.com/docs/messenger-platform/discovery/checkbox-plugin).
 * @category Event
 * @subscription `messaging_optins`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_optins).
 */
interface OptinEvent extends EventObject<'optin'>, EventBase, Optin {}

/**
 * PolicyEnforcementEvent will be sent to an app if the page it manages does not
 * conform to Messenger Platform policy.
 * @category Event
 * @subscription `messaging_policy_enforcement`
 * @guides Check official [reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_policy_enforcement).
 */
interface PolicyEnforcementEvent
  extends EventObject<'policy_enforcement'>,
    EventBase,
    PolicyEnforcement {}

/**
 * @category Event
 */
interface UnknownEvent extends EventObject<'unknown'>, EventBase {}

export type MessengerEvent =
  | TextMessageEvent
  | TextEchoEvent
  | ImageMessageEvent
  | ImageEchoEvent
  | VideoMessageEvent
  | VideoEchoEvent
  | AudioMessageEvent
  | AudioEchoEvent
  | FileMessageEvent
  | FileEchoEvent
  | LocationMessageEvent
  | ProductTemplateMessageEvent
  | TemplateEchoEvent
  | FallbackMessageEvent
  | FallbackEchoEvent
  | ReactionEvent
  | QuickReplyPostbackEvent
  | ButtonPostbackEvent
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
  | PolicyEnforcementEvent
  | UnknownEvent;
