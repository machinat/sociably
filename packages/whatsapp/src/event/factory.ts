import UserProfile from '../UserProfile';
import {
  TextProto,
  AudioProto,
  ImageProto,
  DocumentProto,
  VideoProto,
  StickerProto,
  UnknownProto,
  ReferralProto,
  InteractiveListProto,
  InteractiveButtonProto,
  QuickReplyProto,
  UserNumberChangeProto,
  UserIdentityChangeProto,
  UnsupportedProto,
  ReadProto,
  SentProto,
  DeliveredProto,
  FailedProto,
  ErrorProto,
} from './protos';
import { ContactData } from '../types';
import { WhatsAppEvent, MessageEvent } from './types';

const makeMessageEvent = (
  messageData,
  businessAccountId: string,
  agentNumberId: string,
  agentNumberDisplay: string,
  contacts: ContactData[]
): MessageEvent => {
  const messageType = messageData.type;
  const messageProto =
    messageType === 'text'
      ? TextProto
      : messageType === 'image'
      ? ImageProto
      : messageType === 'audio'
      ? AudioProto
      : messageType === 'document'
      ? DocumentProto
      : messageType === 'video'
      ? VideoProto
      : messageType === 'sticker'
      ? StickerProto
      : messageType === 'referral'
      ? ReferralProto
      : messageType === 'interactive'
      ? messageData.interactive.type === 'button_reply'
        ? InteractiveButtonProto
        : messageData.interactive.type === 'list_reply'
        ? InteractiveListProto
        : UnknownProto
      : messageType === 'button'
      ? QuickReplyProto
      : messageType === 'system'
      ? messageData.system.type === 'customer_changed_number'
        ? UserNumberChangeProto
        : messageData.system.type === 'customer_identity_changed'
        ? UserIdentityChangeProto
        : UnknownProto
      : messageType === 'unknown'
      ? UnsupportedProto
      : UnknownProto;

  const event: MessageEvent = Object.create(messageProto);

  event.payload = messageData;
  event.businessAccountId = businessAccountId;
  event.agentNumberId = agentNumberId;
  event.agentNumberDisplay = agentNumberDisplay;

  const userNumber = messageData.from;
  const contact = contacts.find(
    ({ wa_id: numberId }) => numberId === userNumber
  );
  if (contact) {
    event.userProfile = new UserProfile(userNumber, contact.profile);
  }

  return event;
};

const makeStatusEvent = (
  statusData,
  businessAccountId: string,
  agentNumberId: string,
  agentNumberDisplay: string
): MessageEvent => {
  const statusType = statusData.type;
  const statusProto =
    statusType === 'read'
      ? ReadProto
      : statusType === 'delivered'
      ? DeliveredProto
      : statusType === 'sent'
      ? SentProto
      : statusType === 'failed'
      ? FailedProto
      : UnknownProto;

  const event: MessageEvent = Object.create(statusProto);

  event.payload = statusData;
  event.businessAccountId = businessAccountId;
  event.agentNumberId = agentNumberId;
  event.agentNumberDisplay = agentNumberDisplay;

  return event;
};

const makeErrorEvent = (
  errorData,
  businessAccountId: string,
  agentNumberId: string,
  agentNumberDisplay: string
): MessageEvent => {
  const event: MessageEvent = Object.create(ErrorProto);

  event.payload = errorData;
  event.businessAccountId = businessAccountId;
  event.agentNumberId = agentNumberId;
  event.agentNumberDisplay = agentNumberDisplay;

  return event;
};

const eventFactory = (updataData): WhatsAppEvent[] => {
  const { id: businessAccountId, changes } = updataData;
  const events: WhatsAppEvent[] = [];

  for (const change of changes) {
    const {
      value: { metadata, contacts, messages, statuses, errors },
    } = change;
    const agentNumber = metadata.phone_number_id;
    const agentNumberDisplay = metadata.display_phone_number;

    if (messages) {
      for (const message of messages) {
        events.push(
          makeMessageEvent(
            message,
            businessAccountId,
            agentNumber,
            agentNumberDisplay,
            contacts
          )
        );
      }
    }

    if (statuses) {
      for (const status of statuses) {
        events.push(
          makeStatusEvent(
            status,
            businessAccountId,
            agentNumber,
            agentNumberDisplay
          )
        );
      }
    }

    if (errors) {
      for (const error of errors) {
        events.push(
          makeErrorEvent(
            error,
            businessAccountId,
            agentNumber,
            agentNumberDisplay
          )
        );
      }
    }
  }

  return events;
};

export default eventFactory;
