/** @internal */ /** */
import mixin from '@machinat/core/utils/mixin';
import type { MessengerRawEvent } from '../types';
import MessengerChat from '../channel';
import MessengerUser from '../user';
import {
  EventBase as Base,
  Message,
  Text,
  QuickReply,
  NLP,
  Media,
  Sticker,
  Location,
  Fallback,
  Echo,
  Standby,
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
import type { MessengerEvent } from './types';

const makeEvent = <
  Proto extends object, // eslint-disable-line @typescript-eslint/ban-types
  Channel extends null | MessengerChat,
  User extends null | MessengerUser
>(
  payload: MessengerRawEvent,
  channel: Channel,
  user: User,
  proto: Proto
): {
  channel: Channel;
  user: User;
  payload: MessengerRawEvent;
} & Proto => {
  const event = Object.create(proto);

  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

const BaseTextProto = mixin(Base, Message, Text, Fallback);
const TextProto = mixin(BaseTextProto, NLP, {
  kind: 'message' as const,
  type: 'text' as const,
});

const EchoTextProto = mixin(BaseTextProto, Echo, {
  kind: 'echo' as const,
  type: 'text' as const,
});
const StandbyTextProto = mixin(BaseTextProto, Standby, {
  kind: 'standby' as const,
  type: 'text' as const,
});

const MediaProto = mixin(Base, Message, Media);

const ImageProto = mixin(MediaProto, Sticker, {
  kind: 'message' as const,
  type: 'image' as const,
});

const VideoProto = mixin(MediaProto, {
  kind: 'message' as const,
  type: 'video' as const,
});
const AudioProto = mixin(MediaProto, {
  kind: 'message' as const,
  type: 'audio' as const,
});
const FileProto = mixin(MediaProto, {
  kind: 'message' as const,
  type: 'file' as const,
});

const EchoMediaProto = mixin(MediaProto, Echo);
const EchoImageProto = mixin(EchoMediaProto, {
  kind: 'echo' as const,
  type: 'image' as const,
});
const EchoVideoProto = mixin(EchoMediaProto, {
  kind: 'echo' as const,
  type: 'video' as const,
});
const EchoAudioProto = mixin(EchoMediaProto, {
  kind: 'echo' as const,
  type: 'audio' as const,
});
const EchoFileProto = mixin(EchoMediaProto, {
  kind: 'echo' as const,
  type: 'file' as const,
});

const StandbyImageProto = mixin(ImageProto, Standby, {
  kind: 'standby' as const,
  type: 'image' as const,
});

const StandbyMediaProto = mixin(MediaProto, Standby);
const StandbyVideoProto = mixin(StandbyMediaProto, {
  kind: 'standby' as const,
  type: 'video' as const,
});
const StandbyAudioProto = mixin(StandbyMediaProto, {
  kind: 'standby' as const,
  type: 'audio' as const,
});
const StandbyFileProto = mixin(StandbyMediaProto, {
  kind: 'standby' as const,
  type: 'file' as const,
});

const LocationProto = mixin(Base, Message, Location, {
  kind: 'message' as const,
  type: 'location' as const,
});
const StandbyLocationProto = mixin(LocationProto, Standby, {
  kind: 'standby' as const,
  type: 'location' as const,
});

const ProductTemplateProto = mixin(Base, Message, Template, TemplateProduct, {
  kind: 'message' as const,
  type: 'product_template' as const,
});

const StandbyProductTemplateProto = mixin(ProductTemplateProto, Standby, {
  kind: 'standby' as const,
  type: 'product_template' as const,
});

const EchoTemplateProto = mixin(Base, Message, Echo, Template, {
  kind: 'echo' as const,
  type: 'template' as const,
});

const FallbackProto = mixin(Base, Message, Fallback, {
  kind: 'message' as const,
  type: 'fallback' as const,
});

const EchoFallbackProto = mixin(FallbackProto, Echo, {
  kind: 'echo' as const,
  type: 'fallback' as const,
});

const StandbyFallbackProto = mixin(FallbackProto, Standby, {
  kind: 'standby' as const,
  type: 'fallback' as const,
});

const ReactionProto = mixin(Base, Reaction, {
  kind: 'action' as const,
  type: 'reaction' as const,
});

const QuickReplyProto = mixin(Base, Message, Text, QuickReply, {
  kind: 'postback' as const,
  type: 'quick_reply' as const,
});

const StandbyQuickReplyProto = mixin(QuickReplyProto, Standby, {
  kind: 'standby' as const,
  type: 'quick_reply' as const,
});

const PostbackProto = mixin(Base, Postback, {
  kind: 'postback' as const,
  type: 'postback' as const,
});

const StandbyPostbackProto = mixin(Base, Postback, Standby, {
  kind: 'standby' as const,
  type: 'postback' as const,
});

const ReferralProto = mixin(Base, Referral, {
  kind: 'action' as const,
  type: 'referral' as const,
});

const OptinProto = mixin(Base, Optin, {
  kind: 'action' as const,
  type: 'optin' as const,
});

const ReadProto = mixin(Base, Read, {
  kind: 'action' as const,
  type: 'read' as const,
});
const StandbyReadProto = mixin(Base, Read, Standby, {
  kind: 'standby' as const,
  type: 'read' as const,
});

const DeliveryProto = mixin(Base, Delivery, {
  kind: 'system' as const,
  type: 'delivery' as const,
});

const StandbyDeliveryProto = mixin(Base, Delivery, Standby, {
  kind: 'standby' as const,
  type: 'delivery' as const,
});

const AccountLinkingProto = mixin(Base, AccountLinking, {
  kind: 'action' as const,
  type: 'account_linking' as const,
});

const GamePlayProto = mixin(Base, GamePlay, {
  kind: 'action' as const,
  type: 'game_play' as const,
});

const PassThreadControlProto = mixin(Base, PassThreadControl, {
  kind: 'handover_protocol' as const,
  type: 'pass_thread_control' as const,
});

const TakeThreadControlProto = mixin(Base, TakeThreadControl, {
  kind: 'handover_protocol' as const,
  type: 'take_thread_control' as const,
});

const RequestThreadControlProto = mixin(Base, RequestThreadControl, {
  kind: 'handover_protocol' as const,
  type: 'request_thread_control' as const,
});

const AppRolesProto = mixin(Base, AppRoles, {
  kind: 'handover_protocol' as const,
  type: 'app_roles' as const,
});

const PolicyEnforcementProto = mixin(Base, PolicyEnforcement, {
  kind: 'system' as const,
  type: 'policy_enforcement' as const,
});

const UnknownProto = mixin(Base, {
  kind: 'unknown' as const,
  type: 'unknown' as const,
});

const objectHasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwnProperty = (obj, prop) => objectHasOwnProperty.call(obj, prop);

const createEvent = (
  pageId: string,
  isStandby: boolean,
  payload: MessengerRawEvent
): MessengerEvent => {
  if (hasOwnProperty(payload, 'message')) {
    const { message, sender, recepient } = payload;

    const channel = message.is_echo
      ? new MessengerChat(pageId, recepient)
      : new MessengerChat(pageId, sender);
    const user = message.is_echo
      ? new MessengerUser(pageId, recepient.id)
      : new MessengerUser(pageId, sender.id);

    if (hasOwnProperty(message, 'text')) {
      if (hasOwnProperty(message, 'quick_reply')) {
        return isStandby
          ? makeEvent(payload, channel, user, StandbyQuickReplyProto)
          : makeEvent(payload, channel, user, QuickReplyProto);
      }

      return message.is_echo
        ? makeEvent(payload, channel, user, EchoTextProto)
        : isStandby
        ? makeEvent(payload, channel, user, StandbyTextProto)
        : makeEvent(payload, channel, user, TextProto);
    }

    switch (message.attachments[0].type) {
      case 'image':
        return message.is_echo
          ? makeEvent(payload, channel, user, EchoImageProto)
          : isStandby
          ? makeEvent(payload, channel, user, StandbyImageProto)
          : makeEvent(payload, channel, user, ImageProto);
      case 'video':
        return message.is_echo
          ? makeEvent(payload, channel, user, EchoVideoProto)
          : isStandby
          ? makeEvent(payload, channel, user, StandbyVideoProto)
          : makeEvent(payload, channel, user, VideoProto);
      case 'audio':
        return message.is_echo
          ? makeEvent(payload, channel, user, EchoAudioProto)
          : isStandby
          ? makeEvent(payload, channel, user, StandbyAudioProto)
          : makeEvent(payload, channel, user, AudioProto);
      case 'file':
        return message.is_echo
          ? makeEvent(payload, channel, user, EchoFileProto)
          : isStandby
          ? makeEvent(payload, channel, user, StandbyFileProto)
          : makeEvent(payload, channel, user, FileProto);
      case 'location':
        return isStandby
          ? makeEvent(payload, channel, user, StandbyLocationProto)
          : makeEvent(payload, channel, user, LocationProto);
      case 'template':
        return message.is_echo
          ? makeEvent(payload, channel, user, EchoTemplateProto)
          : hasOwnProperty(message.attachments[0].payload, 'product')
          ? isStandby
            ? makeEvent(payload, channel, user, StandbyProductTemplateProto)
            : makeEvent(payload, channel, user, ProductTemplateProto)
          : makeEvent(payload, channel, user, UnknownProto);
      case 'fallback':
        return message.is_echo
          ? makeEvent(payload, channel, user, EchoFallbackProto)
          : isStandby
          ? makeEvent(payload, channel, user, StandbyFallbackProto)
          : makeEvent(payload, channel, user, FallbackProto);
      default:
        return makeEvent(payload, channel, user, UnknownProto);
    }
  }

  if (hasOwnProperty(payload, 'policy-enforcement')) {
    return makeEvent(payload, null, null, PolicyEnforcementProto);
  }

  if (hasOwnProperty(payload, 'optin')) {
    const { optin, sender } = payload;

    const channel =
      sender !== undefined
        ? new MessengerChat(pageId, sender)
        : new MessengerChat(pageId, { user_ref: optin.user_ref });

    const user =
      sender !== undefined ? new MessengerUser(pageId, sender.id) : null;

    return makeEvent(payload, channel, user, OptinProto);
  }

  if (hasOwnProperty(payload, 'referral')) {
    const { sender } = payload;
    const channel = new MessengerChat(pageId, sender);
    const user = sender.id ? new MessengerUser(pageId, sender.id) : null;
    return makeEvent(payload, channel, user, ReferralProto);
  }

  const { sender } = payload;
  const channel = new MessengerChat(pageId, sender);
  const user = new MessengerUser(pageId, sender.id);

  return hasOwnProperty(payload, 'reaction')
    ? makeEvent(payload, channel, user, ReactionProto)
    : hasOwnProperty(payload, 'read')
    ? isStandby
      ? makeEvent(payload, channel, user, StandbyReadProto)
      : makeEvent(payload, channel, user, ReadProto)
    : hasOwnProperty(payload, 'delivery')
    ? isStandby
      ? makeEvent(payload, channel, user, StandbyDeliveryProto)
      : makeEvent(payload, channel, user, DeliveryProto)
    : hasOwnProperty(payload, 'account_linking')
    ? makeEvent(payload, channel, user, AccountLinkingProto)
    : hasOwnProperty(payload, 'game_play')
    ? makeEvent(payload, channel, user, GamePlayProto)
    : hasOwnProperty(payload, 'take_thread_control')
    ? makeEvent(payload, channel, user, TakeThreadControlProto)
    : hasOwnProperty(payload, 'pass_thread_control')
    ? makeEvent(payload, channel, user, PassThreadControlProto)
    : hasOwnProperty(payload, 'request_thread_control')
    ? makeEvent(payload, channel, user, RequestThreadControlProto)
    : hasOwnProperty(payload, 'app_roles')
    ? makeEvent(payload, channel, user, AppRolesProto)
    : hasOwnProperty(payload, 'postback')
    ? isStandby
      ? makeEvent(payload, channel, user, StandbyPostbackProto)
      : makeEvent(payload, channel, user, PostbackProto)
    : makeEvent(payload, channel, user, UnknownProto);
};

export default createEvent;