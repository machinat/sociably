/** @internal */ /** */
import mixin from '@machinat/core/utils/mixin';
import {
  EventBase as Base,
  Message,
  Text,
  QuickReplyPostback,
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
import type { MessengerRawEvent } from '../types';

const eventFactory = <
  P extends object, // eslint-disable-line @typescript-eslint/ban-types
  K extends string,
  T extends string
>(
  proto: P,
  kind: K,
  type: T
) => (
  payload: MessengerRawEvent
): {
  kind: K;
  type: T;
  payload: MessengerRawEvent;
} & P => {
  const event = Object.create(proto);

  event.payload = payload;
  event.type = type;
  event.kind = kind;

  return event;
};

const TextProto = mixin(Base, Message, Text, Fallback);
export const text = eventFactory(mixin(TextProto, NLP), 'message', 'text');

export const echoText = eventFactory(mixin(TextProto, Echo), 'echo', 'text');
export const standbyText = eventFactory(
  mixin(TextProto, Standby),
  'standby',
  'text'
);

const MediaProto = mixin(Base, Message, Media);

const ImageProto = mixin(MediaProto, Sticker);
export const image = eventFactory(ImageProto, 'message', 'image');

export const video = eventFactory(MediaProto, 'message', 'video');
export const audio = eventFactory(MediaProto, 'message', 'audio');
export const file = eventFactory(MediaProto, 'message', 'file');

const EchoMediaProto = mixin(MediaProto, Echo);
export const echoImage = eventFactory(EchoMediaProto, 'echo', 'image');
export const echoVideo = eventFactory(EchoMediaProto, 'echo', 'video');
export const echoAudio = eventFactory(EchoMediaProto, 'echo', 'audio');
export const echoFile = eventFactory(EchoMediaProto, 'echo', 'file');

export const standbyImage = eventFactory(
  mixin(ImageProto, Standby),
  'standby',
  'image'
);

const StandbyMediaProto = mixin(MediaProto, Standby);
export const standbyVideo = eventFactory(StandbyMediaProto, 'standby', 'video');
export const standbyAudio = eventFactory(StandbyMediaProto, 'standby', 'audio');
export const standbyFile = eventFactory(StandbyMediaProto, 'standby', 'file');

const LocationProto = mixin(Base, Message, Location);
export const location = eventFactory(LocationProto, 'message', 'location');
export const standbyLocation = eventFactory(
  mixin(LocationProto, Standby),
  'standby',
  'location'
);

const TemplateProductProto = mixin(Base, Message, Template, TemplateProduct);
export const productTemplate = eventFactory(
  TemplateProductProto,
  'message',
  'product_template'
);

export const standbyProductTemplate = eventFactory(
  mixin(TemplateProductProto, Standby),
  'standby',
  'product_template'
);

export const echoTemplate = eventFactory(
  mixin(Base, Message, Echo, Template),
  'echo',
  'template'
);

const FallbackProto = mixin(Base, Message, Fallback);
export const fallback = eventFactory(FallbackProto, 'message', 'fallback');

export const echoFallback = eventFactory(
  mixin(FallbackProto, Echo),
  'echo',
  'fallback'
);

export const standbyFallback = eventFactory(
  mixin(FallbackProto, Standby),
  'standby',
  'fallback'
);

export const reaction = eventFactory(
  mixin(Base, Reaction),
  'action',
  'reaction'
);

const QuickReplyPostbackProto = mixin(Base, Message, Text, QuickReplyPostback);
export const quickReplyPostback = eventFactory(
  QuickReplyPostbackProto,
  'postback',
  'quick_reply'
);

export const standbyQuickReplyPostback = eventFactory(
  mixin(QuickReplyPostbackProto, Standby),
  'standby',
  'quick_reply'
);

const PostbackProto = mixin(Base, Postback);
export const postback = eventFactory(PostbackProto, 'postback', 'postback');

export const standbyPostback = eventFactory(
  mixin(PostbackProto, Standby),
  'standby',
  'postback'
);

export const referral = eventFactory(
  mixin(Base, Referral),
  'action',
  'referral'
);

export const optin = eventFactory(mixin(Base, Optin), 'action', 'optin');

const ReadProto = mixin(Base, Read);
export const read = eventFactory(ReadProto, 'action', 'read');
export const standbyRead = eventFactory(
  mixin(ReadProto, Standby),
  'standby',
  'read'
);

const DeliveryProto = mixin(Base, Delivery);
export const delivery = eventFactory(DeliveryProto, 'system', 'delivery');
export const standbyDelivery = eventFactory(
  mixin(DeliveryProto, Standby),
  'standby',
  'delivery'
);

export const accountLinking = eventFactory(
  mixin(Base, AccountLinking),
  'action',
  'account_linking'
);

export const gamePlay = eventFactory(
  mixin(Base, GamePlay),
  'action',
  'game_play'
);

export const passThreadControl = eventFactory(
  mixin(Base, PassThreadControl),
  'handover_protocol',
  'pass_thread_control'
);

export const takeThreadControl = eventFactory(
  mixin(Base, TakeThreadControl),
  'handover_protocol',
  'take_thread_control'
);

export const requestThreadControl = eventFactory(
  mixin(Base, RequestThreadControl),
  'handover_protocol',
  'request_thread_control'
);

export const appRoles = eventFactory(
  mixin(Base, AppRoles),
  'handover_protocol',
  'app_roles'
);

export const policyEnforcement = eventFactory(
  mixin(Base, PolicyEnforcement),
  'system',
  'policy_enforcement'
);

export const unknown = eventFactory(Base, 'unknown', 'unknown');
