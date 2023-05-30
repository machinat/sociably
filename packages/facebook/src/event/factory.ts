import { mixin } from '@sociably/core/utils';
import type { FacebookRawEvent, FacebookThread } from '../types.js';
import FacebookChat from '../Chat.js';
import FacebookUser from '../User.js';
import FacebookPage from '../Page.js';
import {
  EventBase as Base,
  Message,
  Text,
  QuickReply,
  Nlp,
  Media,
  Sticker,
  Location,
  Fallback,
  Echo,
  Standby,
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
  OneTimeNotifOptin,
  PolicyEnforcement,
  Postback,
  Referral,
} from './mixin.js';
import type { FacebookEvent } from './types.js';

const makeEvent = <
  Proto extends {},
  Thread extends null | FacebookThread,
  User extends null | FacebookUser
>(
  payload: FacebookRawEvent,
  page: FacebookPage,
  chat: Thread,
  user: User,
  proto: Proto
): {
  channel: FacebookPage;
  thread: Thread;
  user: User;
  payload: FacebookRawEvent;
} & Proto => {
  const event = Object.create(proto);

  event.payload = payload;
  event.thread = chat;
  event.channel = page;
  event.user = user;

  return event;
};

const BaseTextProto = mixin(Base, Message, Text, Fallback);
const TextProto = mixin(BaseTextProto, Nlp, {
  category: 'message' as const,
  type: 'text' as const,
});

const EchoTextProto = mixin(BaseTextProto, Echo, {
  category: 'echo' as const,
  type: 'text' as const,
});
const StandbyTextProto = mixin(BaseTextProto, Standby, {
  category: 'standby' as const,
  type: 'text' as const,
});

const MediaProto = mixin(Base, Message, Media);

const ImageProto = mixin(MediaProto, Sticker, {
  category: 'message' as const,
  type: 'image' as const,
});

const VideoProto = mixin(MediaProto, {
  category: 'message' as const,
  type: 'video' as const,
});
const AudioProto = mixin(MediaProto, {
  category: 'message' as const,
  type: 'audio' as const,
});
const FileProto = mixin(MediaProto, {
  category: 'message' as const,
  type: 'file' as const,
});

const EchoMediaProto = mixin(MediaProto, Echo);
const EchoImageProto = mixin(EchoMediaProto, {
  category: 'echo' as const,
  type: 'image' as const,
});
const EchoVideoProto = mixin(EchoMediaProto, {
  category: 'echo' as const,
  type: 'video' as const,
});
const EchoAudioProto = mixin(EchoMediaProto, {
  category: 'echo' as const,
  type: 'audio' as const,
});
const EchoFileProto = mixin(EchoMediaProto, {
  category: 'echo' as const,
  type: 'file' as const,
});

const StandbyImageProto = mixin(ImageProto, Standby, {
  category: 'standby' as const,
  type: 'image' as const,
});

const StandbyMediaProto = mixin(MediaProto, Standby);
const StandbyVideoProto = mixin(StandbyMediaProto, {
  category: 'standby' as const,
  type: 'video' as const,
});
const StandbyAudioProto = mixin(StandbyMediaProto, {
  category: 'standby' as const,
  type: 'audio' as const,
});
const StandbyFileProto = mixin(StandbyMediaProto, {
  category: 'standby' as const,
  type: 'file' as const,
});

const LocationProto = mixin(Base, Message, Location, {
  category: 'message' as const,
  type: 'location' as const,
});
const StandbyLocationProto = mixin(LocationProto, Standby, {
  category: 'standby' as const,
  type: 'location' as const,
});

const ProductTemplateProto = mixin(Base, Message, TemplateProduct, {
  category: 'message' as const,
  type: 'product_template' as const,
});

const StandbyProductTemplateProto = mixin(ProductTemplateProto, Standby, {
  category: 'standby' as const,
  type: 'product_template' as const,
});

const EchoTemplateProto = mixin(Base, Message, Echo, {
  category: 'echo' as const,
  type: 'template' as const,
});

const FallbackProto = mixin(Base, Message, Fallback, {
  category: 'message' as const,
  type: 'fallback' as const,
});

const EchoFallbackProto = mixin(FallbackProto, Echo, {
  category: 'echo' as const,
  type: 'fallback' as const,
});

const StandbyFallbackProto = mixin(FallbackProto, Standby, {
  category: 'standby' as const,
  type: 'fallback' as const,
});

const ReactionProto = mixin(Base, Reaction, {
  category: 'action' as const,
  type: 'reaction' as const,
});

const QuickReplyProto = mixin(Base, Message, Text, QuickReply, {
  category: 'postback' as const,
  type: 'quick_reply' as const,
});

const StandbyQuickReplyProto = mixin(QuickReplyProto, Standby, {
  category: 'standby' as const,
  type: 'quick_reply' as const,
});

const PostbackProto = mixin(Base, Postback, {
  category: 'postback' as const,
  type: 'postback' as const,
});

const StandbyPostbackProto = mixin(Base, Postback, Standby, {
  category: 'standby' as const,
  type: 'postback' as const,
});

const ReferralProto = mixin(Base, Referral, {
  category: 'action' as const,
  type: 'referral' as const,
});

const OptinProto = mixin(Base, Optin, {
  category: 'postback' as const,
  type: 'optin' as const,
});

const OneTimeNotifOptinProto = mixin(Base, OneTimeNotifOptin, {
  category: 'postback' as const,
  type: 'one_time_notif_optin' as const,
});

const ReadProto = mixin(Base, Read, {
  category: 'action' as const,
  type: 'read' as const,
});
const StandbyReadProto = mixin(Base, Read, Standby, {
  category: 'standby' as const,
  type: 'read' as const,
});

const DeliveryProto = mixin(Base, Delivery, {
  category: 'system' as const,
  type: 'delivery' as const,
});

const StandbyDeliveryProto = mixin(Base, Delivery, Standby, {
  category: 'standby' as const,
  type: 'delivery' as const,
});

const AccountLinkingProto = mixin(Base, AccountLinking, {
  category: 'action' as const,
  type: 'account_linking' as const,
});

const GamePlayProto = mixin(Base, GamePlay, {
  category: 'action' as const,
  type: 'game_play' as const,
});

const PassThreadControlProto = mixin(Base, PassThreadControl, {
  category: 'handover_protocol' as const,
  type: 'pass_thread_control' as const,
});

const TakeThreadControlProto = mixin(Base, TakeThreadControl, {
  category: 'handover_protocol' as const,
  type: 'take_thread_control' as const,
});

const RequestThreadControlProto = mixin(Base, RequestThreadControl, {
  category: 'handover_protocol' as const,
  type: 'request_thread_control' as const,
});

const AppRolesProto = mixin(Base, AppRoles, {
  category: 'handover_protocol' as const,
  type: 'app_roles' as const,
});

const PolicyEnforcementProto = mixin(Base, PolicyEnforcement, {
  category: 'system' as const,
  type: 'policy_enforcement' as const,
});

const UnknownProto = mixin(Base, {
  category: 'unknown' as const,
  type: 'unknown' as const,
});

const objectHasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwnProperty = (obj, prop) => objectHasOwnProperty.call(obj, prop);

const createEvent = (
  pageId: string,
  isStandby: boolean,
  payload: FacebookRawEvent
): FacebookEvent => {
  const page = new FacebookPage(pageId);

  if (hasOwnProperty(payload, 'message')) {
    const { message, sender, recepient } = payload;

    const chat = message.is_echo
      ? new FacebookChat(pageId, recepient)
      : new FacebookChat(pageId, sender);
    const user = message.is_echo
      ? new FacebookUser(pageId, recepient.id)
      : new FacebookUser(pageId, sender.id);

    if (hasOwnProperty(message, 'text')) {
      if (hasOwnProperty(message, 'quick_reply')) {
        return isStandby
          ? makeEvent(payload, page, chat, user, StandbyQuickReplyProto)
          : makeEvent(payload, page, chat, user, QuickReplyProto);
      }

      return message.is_echo
        ? makeEvent(payload, page, chat, user, EchoTextProto)
        : isStandby
        ? makeEvent(payload, page, chat, user, StandbyTextProto)
        : makeEvent(payload, page, chat, user, TextProto);
    }

    switch (message.attachments[0].type) {
      case 'image':
        return message.is_echo
          ? makeEvent(payload, page, chat, user, EchoImageProto)
          : isStandby
          ? makeEvent(payload, page, chat, user, StandbyImageProto)
          : makeEvent(payload, page, chat, user, ImageProto);
      case 'video':
        return message.is_echo
          ? makeEvent(payload, page, chat, user, EchoVideoProto)
          : isStandby
          ? makeEvent(payload, page, chat, user, StandbyVideoProto)
          : makeEvent(payload, page, chat, user, VideoProto);
      case 'audio':
        return message.is_echo
          ? makeEvent(payload, page, chat, user, EchoAudioProto)
          : isStandby
          ? makeEvent(payload, page, chat, user, StandbyAudioProto)
          : makeEvent(payload, page, chat, user, AudioProto);
      case 'file':
        return message.is_echo
          ? makeEvent(payload, page, chat, user, EchoFileProto)
          : isStandby
          ? makeEvent(payload, page, chat, user, StandbyFileProto)
          : makeEvent(payload, page, chat, user, FileProto);
      case 'location':
        return isStandby
          ? makeEvent(payload, page, chat, user, StandbyLocationProto)
          : makeEvent(payload, page, chat, user, LocationProto);
      case 'template':
        return message.is_echo
          ? makeEvent(payload, page, chat, user, EchoTemplateProto)
          : hasOwnProperty(message.attachments[0].payload, 'product')
          ? isStandby
            ? makeEvent(payload, page, chat, user, StandbyProductTemplateProto)
            : makeEvent(payload, page, chat, user, ProductTemplateProto)
          : makeEvent(payload, page, chat, user, UnknownProto);
      case 'fallback':
        return message.is_echo
          ? makeEvent(payload, page, chat, user, EchoFallbackProto)
          : isStandby
          ? makeEvent(payload, page, chat, user, StandbyFallbackProto)
          : makeEvent(payload, page, chat, user, FallbackProto);
      default:
        return makeEvent(payload, page, chat, user, UnknownProto);
    }
  }

  if (hasOwnProperty(payload, 'policy-enforcement')) {
    return makeEvent(payload, page, null, null, PolicyEnforcementProto);
  }

  if (hasOwnProperty(payload, 'optin')) {
    const { optin, sender } = payload;

    if (optin.type === 'one_time_notif_req') {
      return makeEvent(
        payload,
        page,
        new FacebookChat(pageId, sender),
        new FacebookUser(pageId, sender.id),
        OneTimeNotifOptinProto
      );
    }

    const chat = !sender
      ? new FacebookChat<'user_ref'>(pageId, { user_ref: optin.user_ref })
      : new FacebookChat<'user'>(pageId, sender);

    const user =
      sender !== undefined ? new FacebookUser(pageId, sender.id) : null;

    return makeEvent(payload, page, chat, user, OptinProto);
  }

  if (hasOwnProperty(payload, 'referral')) {
    const { sender } = payload;
    const chat = new FacebookChat<'user' | 'user_ref'>(pageId, sender);
    const user = sender.id ? new FacebookUser(pageId, sender.id) : null;
    return makeEvent(payload, page, chat, user, ReferralProto);
  }

  if (hasOwnProperty(payload, 'postback')) {
    const { sender } = payload;
    const chat = new FacebookChat<'user' | 'user_ref'>(pageId, sender);
    const user = sender.id ? new FacebookUser(pageId, sender.id) : null;
    return isStandby
      ? makeEvent(payload, page, chat, user, StandbyPostbackProto)
      : makeEvent(payload, page, chat, user, PostbackProto);
  }

  const { sender } = payload;
  const chat = new FacebookChat(pageId, sender);
  const user = new FacebookUser(pageId, sender.id);

  return hasOwnProperty(payload, 'reaction')
    ? makeEvent(payload, page, chat, user, ReactionProto)
    : hasOwnProperty(payload, 'read')
    ? isStandby
      ? makeEvent(payload, page, chat, user, StandbyReadProto)
      : makeEvent(payload, page, chat, user, ReadProto)
    : hasOwnProperty(payload, 'delivery')
    ? isStandby
      ? makeEvent(payload, page, chat, user, StandbyDeliveryProto)
      : makeEvent(payload, page, chat, user, DeliveryProto)
    : hasOwnProperty(payload, 'account_linking')
    ? makeEvent(payload, page, chat, user, AccountLinkingProto)
    : hasOwnProperty(payload, 'game_play')
    ? makeEvent(payload, page, chat, user, GamePlayProto)
    : hasOwnProperty(payload, 'take_thread_control')
    ? makeEvent(payload, page, chat, user, TakeThreadControlProto)
    : hasOwnProperty(payload, 'pass_thread_control')
    ? makeEvent(payload, page, chat, user, PassThreadControlProto)
    : hasOwnProperty(payload, 'request_thread_control')
    ? makeEvent(payload, page, chat, user, RequestThreadControlProto)
    : hasOwnProperty(payload, 'app_roles')
    ? makeEvent(payload, page, chat, user, AppRolesProto)
    : makeEvent(payload, page, chat, user, UnknownProto);
};

export default createEvent;
