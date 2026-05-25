import { SociablyUser, SociablyAgent } from '@sociably/core';
import type { MessengerRawEvent, MessengerChat } from '../types.js';
import {
  EventInstancesCreator,
  TextMessageEvent,
  ImageMessageEvent,
  VideoMessageEvent,
  AudioMessageEvent,
  FileMessageEvent,
  LocationMessageEvent,
  ProductTemplateMessageEvent,
  FallbackMessageEvent,
  QuickReplyMessageEvent,
  ReactionEvent,
  OneTimeNotifOptinEvent,
  OptinEvent,
  PolicyEnforcementEvent,
  PostbackEvent,
  ReferralEvent,
  ReadEvent,
  DeliveryEvent,
  AccountLinkingEvent,
  GamePlayEvent,
  PassThreadControlEvent,
  TakeThreadControlEvent,
  RequestThreadControlEvent,
  AppRolesEvent,
  UnknownMessageEvent,
  UnknownEvent,
} from './events.js';

const hasOwnProperty = (obj: object, prop: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const createEventFactory =
  <
    Agent extends SociablyAgent,
    Chat extends MessengerChat,
    User extends SociablyUser,
  >(
    instancesCreator: EventInstancesCreator<Agent, Chat, User>,
  ) =>
  (pageId: string, isStandby: boolean, payload: MessengerRawEvent) => {
    const eventsArgs = [instancesCreator, pageId, payload, isStandby] as const;

    if (hasOwnProperty(payload, 'message')) {
      const { message } = payload;
      if (hasOwnProperty(message, 'text')) {
        return hasOwnProperty(message, 'quick_reply')
          ? new QuickReplyMessageEvent(...eventsArgs)
          : new TextMessageEvent(...eventsArgs);
      }

      switch (message.attachments[0].type) {
        case 'image':
          return new ImageMessageEvent(...eventsArgs);
        case 'video':
          return new VideoMessageEvent(...eventsArgs);
        case 'audio':
          return new AudioMessageEvent(...eventsArgs);
        case 'file':
          return new FileMessageEvent(...eventsArgs);
        case 'location':
          return new LocationMessageEvent(...eventsArgs);
        case 'template':
          return hasOwnProperty(message.attachments[0].payload, 'product')
            ? new ProductTemplateMessageEvent(...eventsArgs)
            : new UnknownMessageEvent(...eventsArgs);
        case 'fallback':
          return new FallbackMessageEvent(...eventsArgs);

        default:
          return new UnknownEvent(...eventsArgs);
      }
    }

    if (hasOwnProperty(payload, 'policy-enforcement')) {
      return new PolicyEnforcementEvent(...eventsArgs);
    }

    if (hasOwnProperty(payload, 'optin')) {
      if (payload.optin.type === 'one_time_notif_req') {
        return new OneTimeNotifOptinEvent(...eventsArgs);
      }
      return new OptinEvent(...eventsArgs);
    }

    if (hasOwnProperty(payload, 'referral')) {
      return new ReferralEvent(...eventsArgs);
    }

    if (hasOwnProperty(payload, 'postback')) {
      return new PostbackEvent(...eventsArgs);
    }

    return hasOwnProperty(payload, 'reaction')
      ? new ReactionEvent(...eventsArgs)
      : hasOwnProperty(payload, 'read')
      ? new ReadEvent(...eventsArgs)
      : hasOwnProperty(payload, 'delivery')
      ? new DeliveryEvent(...eventsArgs)
      : hasOwnProperty(payload, 'account_linking')
      ? new AccountLinkingEvent(...eventsArgs)
      : hasOwnProperty(payload, 'game_play')
      ? new GamePlayEvent(...eventsArgs)
      : hasOwnProperty(payload, 'take_thread_control')
      ? new TakeThreadControlEvent(...eventsArgs)
      : hasOwnProperty(payload, 'pass_thread_control')
      ? new PassThreadControlEvent(...eventsArgs)
      : hasOwnProperty(payload, 'request_thread_control')
      ? new RequestThreadControlEvent(...eventsArgs)
      : hasOwnProperty(payload, 'app_roles')
      ? new AppRolesEvent(...eventsArgs)
      : new UnknownEvent(...eventsArgs);
  };

export default createEventFactory;
