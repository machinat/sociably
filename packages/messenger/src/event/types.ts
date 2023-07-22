import type {
  EventBase,
  Message,
  Text,
  QuickReply,
  Nlp,
  Media,
  Sticker,
  Location,
  Fallback,
  Echo,
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
  OneTimeNotifOptin,
  Optin,
  PolicyEnforcement,
  Postback,
  Referral,
} from './mixin.js';

export interface TextEventProto
  extends EventBase,
    Message,
    Text,
    Fallback,
    Nlp {}

export interface TextEchoEventProto
  extends EventBase,
    Message,
    Text,
    Fallback,
    Echo {}

export interface ImageEventProto extends EventBase, Message, Media, Sticker {}

export interface ImageEchoEventProto extends EventBase, Message, Media, Echo {}

export interface VideoEventProto extends EventBase, Message, Media {}

export interface VideoEchoEventProto extends EventBase, Message, Media, Echo {}

export interface AudioEventProto extends EventBase, Message, Media {}

export interface AudioEchoEventProto extends EventBase, Message, Media, Echo {}

export interface FileEventProto extends EventBase, Message, Media {}

export interface FileEchoEventProto extends EventBase, Message, Media, Echo {}

export interface LocationEventProto extends EventBase, Message, Location {}

export interface ProductTemplateEventProto
  extends EventBase,
    Message,
    TemplateProduct {}

export interface TemplateEchoEventProto extends EventBase, Message, Echo {}

export interface FallbackEventProto extends EventBase, Message, Fallback {}

export interface FallbackEchoEventProto
  extends EventBase,
    Message,
    Fallback,
    Echo {}

export interface ReactionEventProto extends EventBase, Reaction {}

export interface QuickReplyEventProto
  extends EventBase,
    Message,
    Text,
    QuickReply {}

export interface PostbackEventProto extends EventBase, Postback {}

export interface ReferralEventProto extends EventBase, Referral {}

export interface ReadEventProto extends EventBase, Read {}

export interface DeliveryEventProto extends EventBase, Delivery {}

export interface AccountLinkingEventProto extends EventBase, AccountLinking {}

export interface GamePlayEventProto extends EventBase, GamePlay {}

export interface PassThreadControlEventProto
  extends EventBase,
    PassThreadControl {}

export interface TakeThreadControlEventProto
  extends EventBase,
    TakeThreadControl {}

export interface RequestThreadControlEventProto
  extends EventBase,
    RequestThreadControl {}

export interface AppRolesEventProto extends EventBase, AppRoles {}

export interface OptinEventProto extends EventBase, Optin {}

export interface OneTimeNotifOptinEventProto
  extends EventBase,
    OneTimeNotifOptin {}

export interface PolicyEnforcementEventProto
  extends EventBase,
    PolicyEnforcement {}

export type UnknownEventProto = EventBase;

export type MessengerEventProto =
  | TextEventProto
  | TextEchoEventProto
  | ImageEventProto
  | ImageEchoEventProto
  | VideoEventProto
  | VideoEchoEventProto
  | AudioEventProto
  | AudioEchoEventProto
  | FileEventProto
  | FileEchoEventProto
  | LocationEventProto
  | ProductTemplateEventProto
  | TemplateEchoEventProto
  | FallbackEventProto
  | FallbackEchoEventProto
  | ReactionEventProto
  | QuickReplyEventProto
  | PostbackEventProto
  | ReferralEventProto
  | ReadEventProto
  | DeliveryEventProto
  | AccountLinkingEventProto
  | GamePlayEventProto
  | PassThreadControlEventProto
  | TakeThreadControlEventProto
  | RequestThreadControlEventProto
  | AppRolesEventProto
  | OptinEventProto
  | OneTimeNotifOptinEventProto
  | PolicyEnforcementEventProto
  | UnknownEventProto;
